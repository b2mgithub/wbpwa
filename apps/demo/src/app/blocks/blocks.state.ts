import { computed, inject } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@devils-offline/offline-sync';
import { withGridState, withOfflineDataService } from '@devils-offline/store';

import { Block } from './blocks.model';
import { IDBBlocksAdapter } from './blocks.adapter';

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
    apiUrl: 'https://pwacore.b2mapp.ca/api/Blocks',
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
      
      const init = async () => {
        await adapter.init();

        try {
          await store['load']();
          console.log('📦 Loaded blocks from IDB:', store['entities']().length);
        } catch (err) {
          console.error('❌ Failed to load blocks from IDB:', err);
        }

        store['syncFromServer']();
      };

      init();
    },
  })
);
