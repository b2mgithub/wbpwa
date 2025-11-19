/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { 
  CacheFirst, 
  NetworkFirst,
  StaleWhileRevalidate 
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & { currentUserId?: string };

// Service Worker Version - increment this to force cache invalidation
const VERSION = '2025-11-28-v1';
console.log(`🔧 Service Worker Version: ${VERSION}`);

// Apply version to all cache names
const CACHE_PREFIX = `devils-offline-${VERSION}`;
const CACHES = {
  api: `${CACHE_PREFIX}-api`,
  fonts: `${CACHE_PREFIX}-fonts`,
  fontFiles: `${CACHE_PREFIX}-font-files`,
  images: `${CACHE_PREFIX}-images`,
  kendo: `${CACHE_PREFIX}-kendo`
};

// Background Sync API types
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

// Clean up old caches from previous versions
cleanupOutdatedCaches();

// Precache app shell - Workbox injects the manifest here at build time
// This caches index.html, main.js, styles.css, etc.
precacheAndRoute(self.__WB_MANIFEST);

// ============================================================================
// NAVIGATION FALLBACK - Handle offline page refreshes
// ============================================================================

// This is critical for SPAs: when the user refreshes the page while offline,
// we need to serve index.html from the cache so the Angular app can boot.
// Without this, refreshing while offline will fail with a network error.
import { NavigationRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';

// Use Workbox's built-in helper to serve the precached index.html for navigation requests
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
  // Exclude API requests from navigation handling
  denylist: [new RegExp('/api/')],
});

registerRoute(navigationRoute);

console.log('🚀 Service Worker initialized');

// ============================================================================
// API CACHING - Cache GET requests with Network First strategy
// ============================================================================

// Cache API GET requests to your backend with Network First (try network, fall back to cache)
registerRoute(
  ({ url, request }) => 
    url.origin === 'https://pwacore.b2mapp.ca' &&
    url.pathname.startsWith('/api/') && 
    request.method === 'GET',
  new NetworkFirst({
    cacheName: CACHES.api,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// ============================================================================
// STATIC ASSETS CACHING
// ============================================================================

// Cache Google Fonts stylesheets with Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: CACHES.fonts,
  })
);

// Cache Google Fonts files with Cache First (they never change)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: CACHES.fontFiles,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images with Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache Kendo UI CDN assets (if you're using CDN)
registerRoute(
  ({ url }) => url.origin === 'https://kendo.cdn.telerik.com',
  new CacheFirst({
    cacheName: CACHES.kendo,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 50,
      }),
    ],
  })
);

// ============================================================================
// SERVICE WORKER LIFECYCLE EVENTS
// ============================================================================

self.addEventListener('install', () => {
  console.log('⚙️  Service Worker installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Store userId for database access
  if (event.data && event.data.type === 'SET_USER_ID') {
    // Store in a global variable for this service worker instance
    self.currentUserId = event.data.userId;
    console.log('📝 Service worker received userId:', event.data.userId);
  }
});

// ============================================================================
// BACKGROUND SYNC - Automatically retry failed requests
// ============================================================================

self.addEventListener('sync', (event) => {
  const syncEvent = event as unknown as SyncEvent;
  console.log('🔄 Sync event triggered:', syncEvent.tag);
  
  if (syncEvent.tag === 'failed-requests-sync') {
    syncEvent.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests(): Promise<void> {
  console.log('🔄 SERVICE WORKER Background Sync - Processing failed requests queue...');
  
  try {
    // Open IndexedDB to get failed requests
    const db = await openRequestsDB();
    const requests = await getFailedRequests(db);
    
    console.log(`📋 SERVICE WORKER - Found ${requests.length} failed requests to retry`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const request of requests) {
      try {
        console.log(`🔄 SERVICE WORKER - Retrying ${request.operation} for product ${request.productId}...`);
        
        // Retry the request
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        
        if (response.ok) {
          // Success - remove from queue
          await removeFailedRequest(db, request.id);
          successCount++;
          console.log(`✅ SERVICE WORKER - Successfully synced ${request.operation} for product ${request.productId}`);
        } else {
          // Failed - increment retry count
          request.retryCount++;
          await updateFailedRequest(db, request);
          failCount++;
          console.log(`❌ SERVICE WORKER - Retry failed (status ${response.status}) for ${request.operation} on product ${request.productId}`);
        }
      } catch (error) {
        // Network error - increment retry count
        request.retryCount++;
        await updateFailedRequest(db, request);
        failCount++;
        console.error(`❌ SERVICE WORKER - Network error retrying ${request.operation}:`, error);
      }
    }
    
    console.log(`🔄 SERVICE WORKER - Sync complete: ${successCount} succeeded, ${failCount} failed`);
    
    // Notify app of sync results
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        successCount,
        failCount,
        remaining: failCount,
      });
    });
    
  } catch (error) {
    console.error('❌ SERVICE WORKER - Error during sync:', error);
  }
}

// IndexedDB helper functions for service worker
function openRequestsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Get userId from the global variable set by the app
    const userId = self.currentUserId;
    
    if (!userId) {
      console.warn('⚠️  Cannot open database: userId not yet received from app');
      reject(new Error('UserId not available - wait for SET_USER_ID message'));
      return;
    }
    
    const dbName = `DevilsOfflineDB-${userId}`;
    console.log('🔧 Opening database:', dbName);
    const request = indexedDB.open(dbName, 4);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface FailedRequest {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  url: string;
  body: unknown;
  timestamp: number;
  retryCount: number;
  productId: string;
  operation: 'create' | 'update' | 'remove';
}

function getFailedRequests(db: IDBDatabase): Promise<FailedRequest[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as FailedRequest[]);
    request.onerror = () => reject(request.error);
  });
}

function removeFailedRequest(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function updateFailedRequest(db: IDBDatabase, request: FailedRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    const updateRequest = store.put(request);
    
    updateRequest.onsuccess = () => resolve();
    updateRequest.onerror = () => reject(updateRequest.error);
  });
}
