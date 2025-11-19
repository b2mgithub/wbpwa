import { computed, inject, Injectable } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@devils-offline/offline-sync';
import { withGridState, withOfflineDataService } from '@devils-offline/store';
import { EntityAdapter } from '@devils-offline/idb';

import { environment } from '../../environments/environment';
import { Rate } from './rates.model';

@Injectable({ providedIn: 'root' })
export class IDBRatesAdapter extends EntityAdapter<Rate> {
  constructor() {
    super({ storeName: 'rates', idField: 'RateId' });
  }
}

export const RatesStore = signalStore(
  { providedIn: 'root' },
  withDevtools('rates'),
  
  withEntities({ 
    entity: type<Rate>(),
  }),
  
  withOfflineDataService({
    dataServiceType: IDBRatesAdapter,
  }),
  
  withOfflineSync<Rate>({
    entityName: 'Rate',
    apiUrl: `${environment.apiUrl}/Rates`,
    getEntityId: (rate) => rate.RateId,
    updateAllMethod: 'updateAll',
  }),
  
  withGridState({
    storageKey: 'Rates-grid',
    defaultGridState: {
      skip: 0,
      take: 5,
    },
    adapter: IDBRatesAdapter,
  }),

  withComputed(({ entities }) => ({
    rates: computed(() => entities()),
    ratesCount: computed(() => entities().length),
  })),

  withMethods((store) => {
    return {
      async setRates(rates: Rate[]) {
        const ratesWithId = rates.map(r => ({ ...r, id: r.RateId }));
        await store.updateAll(ratesWithId);
      },

      async clearAllRates() {
        const allRates = store['entities']();
        for (const rate of allRates) {
          await store.delete(rate);
        }
      },

      async bulkUpdate(updates: (Partial<Rate> & { RateId: string })[]) {
        const updatedRates = store['entities']().map((r: Rate) => {
          const u = updates.find((x) => x.RateId === r.RateId);
          return u ? { ...r, ...u, id: r.RateId } : r;
        });
        await store.updateAll(updatedRates);
      },
    };
  }),

  withHooks({
    onInit(store) {
      const adapter = inject(IDBRatesAdapter);
      
      // Only initialize adapter - DO NOT load data yet
      // Data will be loaded by DataHydrationService after successful login
      const init = async () => {
        await adapter.init();
      };

      init();
    },
  })
);
