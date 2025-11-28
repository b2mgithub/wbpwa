import { computed, inject, Injectable } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@wbpwa/offline-sync';
import { withGridState, withOfflineDataService } from '@wbpwa/store';
import { EntityAdapter } from '@wbpwa/idb';

import { environment } from '../../environments/environment';
import { Block } from './blocks.model';

@Injectable({ providedIn: 'root' })
export class IDBBlocksAdapter extends EntityAdapter<Block> {
  constructor() {
    super({ storeName: 'blocks', idField: 'BlockId' });
  }
}

export const BlocksStore = signalStore(
  { providedIn: 'root' },
  withDevtools('blocks'),

  withEntities({
    entity: type<Block>(),
  }),

  withOfflineDataService({
    dataServiceType: IDBBlocksAdapter,
  }),

  withOfflineSync<Block>({
    entityName: 'Block',
    apiUrl: `${environment.apiUrl}/Blocks`,
    getEntityId: (block) => block.BlockId,
    updateAllMethod: 'updateAll',
  }),

  withGridState({
    storageKey: 'Blocks-grid',
    defaultGridState: {
      skip: 0,
      take: 10,
    },
    adapter: IDBBlocksAdapter,
  }),

  withComputed(({ entities }) => ({
    blocks: computed(() => entities()),
    blocksCount: computed(() => entities().length),
  })),

  withHooks({
    onInit(store) {
      const adapter = inject(IDBBlocksAdapter);
      
      // Only initialize adapter - DO NOT load data yet
      // Data will be loaded by DataHydrationService after successful login
      const init = async () => {
        await adapter.init();
      };

      init();
    },
  })
);
