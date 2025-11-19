import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStoreFeature, withMethods } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { generateGuid } from '@devils-offline/guid';
import { devilsOfflineDB, FailedRequest } from '@devils-offline/idb';

// Type for Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

export interface WithOfflineSyncConfig<T> {
  entityName: string;
  apiUrl: string;
  getEntityId: (entity: T) => string;
  updateAllMethod: string; // Name of the method to call for bulk updates (e.g., 'updateAllProduct')
}

/**
 * Custom SignalStore feature that adds offline-first server sync capabilities.
 * 
 * The "devils-offline" pattern: The greatest trick is convincing the app the server doesn't exist.
 * - UI operations are optimistic and immediate
 * - Server sync happens in background
 * - Failed requests are persisted to IDB for retry
 * - Uses triple timestamp (branch, submit, commit) for idempotency
 * 
 * Generated methods:
 * - syncFromServer() - Fetches all entities from server and updates local store
 * - createToServer(entity) - Sends POST to server, queues if offline
 * - updateToServer(id, changes) - Sends PATCH to server, queues if offline
 * - removeFromServer(id) - Sends DELETE to server, queues if offline
 * - retryFailedRequests() - Retries all failed requests from IDB
 */
export function withOfflineSync<T>(config: WithOfflineSyncConfig<T>) {
  return signalStoreFeature(
    withMethods((store) => {
      const http = inject(HttpClient);
      const { entityName, apiUrl, getEntityId, updateAllMethod } = config;
      
      const methods = {
        async syncFromServer() {
          try {
            const entities = await firstValueFrom(http.get<T[]>(apiUrl));
            // Map to ensure 'id' field is set for all entities
            const entitiesWithId = entities.map(e => ({ ...e, id: getEntityId(e) }));
            // Call the bulk update method dynamically
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (store as any)[updateAllMethod](entitiesWithId);
            console.log(`✅ Synced ${entityName} from server:`, entitiesWithId.length);
          } catch (err: unknown) {
            console.error(`❌ Failed to sync ${entityName} from server:`, err);
          }
        },

        async createToServer(entity: T) {
          try {
            await firstValueFrom(http.post(apiUrl, entity));
            console.log(`✅ Created ${entityName} on server:`, getEntityId(entity));
          } catch (err) {
            console.error(`❌ Failed to create ${entityName} on server:`, entity, err);
            
            // Save failed request to IDB
            const failedRequest: FailedRequest = {
              id: generateGuid(),
              method: 'POST',
              url: apiUrl,
              body: entity,
              timestamp: Date.now(),
              retryCount: 0,
              productId: getEntityId(entity),
              operation: 'create',
            };
            await devilsOfflineDB.persistFailedRequest(failedRequest);
            
            // Register background sync
            await this.registerBackgroundSync();
          }
        },

        async updateToServer(entityId: string, dirtyFields: Partial<T>) {
          try {
            await firstValueFrom(http.put(`${apiUrl}/${entityId}`, dirtyFields));
            console.log(`✅ Updated ${entityName} on server:`, entityId, JSON.stringify(dirtyFields));
          } catch (err) {
            console.error(`❌ Failed to update ${entityName} on server:`, entityId, JSON.stringify(dirtyFields), err);
            
            // Save failed request to IDB
            const failedRequest: FailedRequest = {
              id: generateGuid(),
              method: 'PUT',
              url: `${apiUrl}/${entityId}`,
              body: dirtyFields,
              timestamp: Date.now(),
              retryCount: 0,
              productId: entityId,
              operation: 'update',
            };
            await devilsOfflineDB.persistFailedRequest(failedRequest);
            
            // Register background sync
            await this.registerBackgroundSync();
          }
        },

        async removeFromServer(entityId: string) {
          try {
            await firstValueFrom(http.delete(`${apiUrl}/${entityId}`));
            console.log(`✅ Removed ${entityName} from server:`, entityId);
          } catch (err) {
            console.error(`❌ Failed to remove ${entityName} from server:`, entityId, err);
            
            // Save failed request to IDB
            const failedRequest: FailedRequest = {
              id: generateGuid(),
              method: 'DELETE',
              url: `${apiUrl}/${entityId}`,
              body: null,
              timestamp: Date.now(),
              retryCount: 0,
              productId: entityId,
              operation: 'remove',
            };
            await devilsOfflineDB.persistFailedRequest(failedRequest);
            
            // Register background sync
            await this.registerBackgroundSync();
          }
        },

        async retryFailedRequests() {
          const failedRequests = await devilsOfflineDB.readFailedRequests();
          console.log(`🔄 Retrying ${failedRequests.length} failed requests...`);
          
          for (const request of failedRequests) {
            try {
              console.log(`🔄 Retrying ${request.operation} for ${entityName} ${request.productId}...`);
              
              // Retry the request based on method
              if (request.method === 'POST') {
                await firstValueFrom(http.post(request.url, request.body));
              } else if (request.method === 'PUT') {
                await firstValueFrom(http.put(request.url, request.body));
              } else if (request.method === 'PATCH') {
                await firstValueFrom(http.patch(request.url, request.body));
              } else if (request.method === 'DELETE') {
                await firstValueFrom(http.delete(request.url));
              }
              
              // Success - remove from IDB
              await devilsOfflineDB.removeFailedRequest(request.id);
              console.log(`✅ Successfully retried ${request.operation} for ${entityName} ${request.productId}`);
            } catch (err) {
              // Failed again - increment retry count
              console.error(`❌ Retry failed for ${request.operation} on ${entityName} ${request.productId}:`, err);
              request.retryCount++;
              await devilsOfflineDB.persistFailedRequest(request);
            }
          }
          
          const remaining = await devilsOfflineDB.readFailedRequests();
          console.log(`🔄 Retry complete. ${remaining.length} requests still pending.`);
        },

        async registerBackgroundSync() {
          if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await (registration as ServiceWorkerRegistrationWithSync).sync.register('failed-requests-sync');
              console.log('🔄 Background sync registered');
            } catch (syncError) {
              console.warn('⚠️ Background sync registration failed:', syncError);
            }
          }
        },
      };
      
      // Setup automatic retry on reconnection (without service worker)
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          console.log('🌐 Browser ONLINE event detected - app will retry in 5 seconds (giving Service Worker priority)...');
          // Use setTimeout to avoid blocking the event handler
          setTimeout(() => {
            methods.retryFailedRequests().catch(err => 
              console.error('Failed to retry requests:', err)
            );
          }, 5000);
        });
      }
      
      return methods;
    })
  );
}

