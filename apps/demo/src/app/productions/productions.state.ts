import { computed, inject } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@devils-offline/offline-sync';
import { withGridState, withOfflineDataService } from '@devils-offline/store';

import { Production } from './productions.model';
import { IDBProductionsAdapter } from './productions.adapter';

export const ProductionsStore = signalStore(
  { providedIn: 'root' },
  withDevtools('productions'),
  
  withEntities({ 
    entity: type<Production>(),
  }),
  
  withOfflineDataService({
    dataServiceType: IDBProductionsAdapter,
  }),
  
  withOfflineSync<Production>({
    entityName: 'Production',
    apiUrl: 'https://pwacore.b2mapp.ca/api/Productions',
    getEntityId: (production) => production.ProductionId,
    updateAllMethod: 'updateAll',
  }),
  
  withGridState({
    storageKey: 'Productions-grid',
    defaultGridState: {
      skip: 0,
      take: 5,
    },
    adapter: IDBProductionsAdapter,
  }),

  withComputed(({ entities }) => ({
    productions: computed(() => entities()),
    productionsCount: computed(() => entities().length),
  })),

  withMethods((store) => {
    return {
      async setProductions(productions: Production[]) {
        const productionsWithId = productions.map(p => ({ ...p, id: p.ProductionId }));
        await store.updateAll(productionsWithId);
      },

      async clearAllProductions() {
        const allProductions = store['entities']();
        for (const production of allProductions) {
          await store.delete(production);
        }
      },

      async bulkUpdate(updates: (Partial<Production> & { ProductionId: string })[]) {
        const updatedProductions = store['entities']().map((p: Production) => {
          const u = updates.find((x) => x.ProductionId === p.ProductionId);
          return u ? { ...p, ...u, id: p.ProductionId } : p;
        });
        await store.updateAll(updatedProductions);
      },
    };
  }),

  withHooks({
    onInit(store) {
      const adapter = inject(IDBProductionsAdapter);
      
      const init = async () => {
        await adapter.init();

        try {
          await store['load']();
          console.log(' Loaded productions from IDB:', store['entities']().length);
        } catch (err) {
          console.error(' Failed to load productions from IDB:', err);
        }

        store['syncFromServer']();
      };

      init();
    },
  })
);
