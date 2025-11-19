import { computed, inject, Injectable } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@devils-offline/offline-sync';
import { withGridState, withOfflineDataService } from '@devils-offline/store';
import { EntityAdapter } from '@devils-offline/idb';

import { environment } from '../../environments/environment';
import { Product } from './products.model';

@Injectable({ providedIn: 'root' })
export class IDBProductsAdapter extends EntityAdapter<Product> {
  constructor() {
    super({ storeName: 'products', idField: 'ProductId' });
  }
}

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withDevtools('products'),
  
  withEntities({ 
    entity: type<Product>(),
  }),
  
  withOfflineDataService({
    dataServiceType: IDBProductsAdapter,
  }),
  
  withOfflineSync<Product>({
    entityName: 'Product',
    apiUrl: `${environment.apiUrl}/Products`,
    getEntityId: (product) => product.ProductId,
    updateAllMethod: 'updateAll',
  }),
  
  withGridState({
    storageKey: 'Products-grid',
    defaultGridState: {
      skip: 0,
      take: 5,
    },
    adapter: IDBProductsAdapter,
  }),

  withComputed(({ entities }) => ({
    products: computed(() => entities()),
    productsCount: computed(() => entities().length),
  })),

  withMethods((store) => {
    return {
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
    };
  }),

  withHooks({
    onInit(store) {
      const adapter = inject(IDBProductsAdapter);
      
      const init = async () => {
        await adapter.init();
      };

      init();
    },
  })
);