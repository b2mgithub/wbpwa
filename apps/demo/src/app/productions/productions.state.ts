import { computed, inject, Injectable } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@wbpwa/offline-sync';
import { withGridState, withOfflineDataService } from '@wbpwa/store';
import { EntityAdapter } from '@wbpwa/idb';

import { environment } from '../../environments/environment';
import { Production } from './productions.model';

// IDB Adapter - must be exported and injectable for DI to work
@Injectable({ providedIn: 'root' })
export class IDBProductionsAdapter extends EntityAdapter<Production> {
  constructor() {
    super({ storeName: 'productions', idField: 'ProductionId' });
  }
}

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
    apiUrl: `${environment.apiUrl}/Productions`,
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
      
      // Only initialize adapter - DO NOT load data yet
      // Data will be loaded by DataHydrationService after successful login
      const init = async () => {
        await adapter.init();
      };

      init();
    },
  })
);
