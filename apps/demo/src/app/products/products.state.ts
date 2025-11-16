import { computed, inject } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@devils-offline/offline-sync';
import { withGridState, withOfflineDataService } from '@devils-offline/store';

import { Product } from './products.model';
import { IDBProductsAdapter } from './products.adapter';

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withDevtools('products'),
  
  // withEntities adds ONLY entity management: entities, entityMap, ids
  withEntities({ 
    entity: type<Product>(),
  }),
  
  // withOfflineDataService adds CRUD methods WITHOUT filter/selectedIds state
  withOfflineDataService({
    dataServiceType: IDBProductsAdapter,
  }),
  
  // withOfflineSync generates server sync methods: syncFromServer, createToServer, updateToServer, removeFromServer, retryFailedRequests
  withOfflineSync<Product>({
    entityName: 'Product',
    apiUrl: 'https://pwacore.b2mapp.ca/api/Products',
    getEntityId: (product) => product.ProductId,
    updateAllMethod: 'updateAll',
  }),
  
  // withGridState adds gridState management with IDB persistence
  withGridState({
    storageKey: 'Products-grid',
    defaultGridState: {
      skip: 0,
      take: 5,
    },
    adapter: IDBProductsAdapter,
  }),

  withComputed(({ entities }) => ({
    // Backwards-compatible alias expected by existing components
    products: computed(() => entities()),
    productsCount: computed(() => entities().length),
  })),

  withMethods((store) => {
    return {
      // withDataService generates these methods automatically - DO NOT redefine:
      // - load() - loads all products from IDB
      // - loadById(id) - loads single product by id
      // - create(entity) - creates product in IDB
      // - update(entity) - updates product in IDB
      // - delete(entity) - deletes product from IDB
      // - updateAll(entities) - bulk update products in IDB
      
      // withOfflineSync generates these methods automatically - DO NOT redefine:
      // - syncFromServer() - syncs all entities from server to IDB
      // - createToServer(entity) - creates entity on server (fire-and-forget with retry)
      // - updateToServer(entityId, changes) - updates entity on server (fire-and-forget with retry)
      // - removeFromServer(entityId) - removes entity from server (fire-and-forget with retry)
      // - retryFailedRequests() - retries all failed server requests from IDB queue
      // - registerBackgroundSync() - registers Service Worker background sync
      
      // Bulk operations using withDataService methods
      async setProducts(products: Product[]) {
        const productsWithId = products.map(p => ({ ...p, id: p.ProductId }));
        await store.updateAll(productsWithId);
      },

      async clearAllProducts() {
        const allProducts = store['entities']();
        for (const product of allProducts) {
          await store.delete(product);
        }
      },

      async bulkUpdate(updates: (Partial<Product> & { ProductId: string })[]) {
        const updatedProducts = store['entities']().map((p: Product) => {
          const u = updates.find((x) => x.ProductId === p.ProductId);
          return u ? { ...p, ...u, id: p.ProductId } : p;
        });
        await store.updateAll(updatedProducts);
      },
      
      // withGridState generates this method automatically - DO NOT redefine:
      // - setGridState(state: GridState) - updates grid state and persists to IDB
    };
  }),

      withHooks({
    onInit(store) {
      const adapter = inject(IDBProductsAdapter);
      
      const init = async () => {
        await adapter.init();

        // Load products from IDB using withDataService's generated method
        try {
          await store['load']();
          console.log('✅ Loaded products from IDB:', store['entities']().length);
        } catch (err) {
          console.error('❌ Failed to load products from IDB:', err);
        }

        // Sync from server (will update IDB automatically via withOfflineSync)
        store['syncFromServer']();
      };

      init();
    },
  })
);