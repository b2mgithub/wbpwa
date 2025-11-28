import { computed, inject, Injectable } from '@angular/core';

import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, type, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

import { withOfflineSync } from '@wbpwa/offline-sync';
import { withGridState, withOfflineDataService } from '@wbpwa/store';
import { EntityAdapter } from '@wbpwa/idb';

import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class IDBUsersAdapter extends EntityAdapter<User> {
  constructor() {
    super({ storeName: 'users', idField: 'UserId' });
  }
}

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withDevtools('users'),
  
  withEntities({ 
    entity: type<User>(),
  }),
  
  withOfflineDataService({
    dataServiceType: IDBUsersAdapter,
  }),
  
  withOfflineSync<User>({
    entityName: 'User',
    apiUrl: 'https://pwacore.b2mapp.ca/Users',
    getEntityId: (user) => user.UserId,
    updateAllMethod: 'updateAll',
  }),
  
  withGridState({
    storageKey: 'Users-grid',
    defaultGridState: {
      skip: 0,
      take: 10,
    },
    adapter: IDBUsersAdapter,
  }),

  withComputed(({ entities }) => ({
    users: computed(() => entities()),
    usersCount: computed(() => entities().length),
  })),

  withMethods((store) => {
    return {
      async setUsers(users: User[]) {
        const usersWithId = users.map(u => ({ ...u, id: u.UserId }));
        await store.updateAll(usersWithId);
      },

      async clearAllUsers() {
        const allUsers = store['entities']();
        for (const user of allUsers) {
          await store.delete(user);
        }
      },
    };
  }),

  withHooks({
    onInit(store) {
      const adapter = inject(IDBUsersAdapter);
      
      const init = async () => {
        await adapter.init();

        try {
          await store['load']();
          console.log('✅ Loaded users from IDB:', store['entities']().length);
        } catch (err) {
          console.error('❌ Failed to load users from IDB:', err);
        }

        store['syncFromServer']();
      };

      init();
    },
  })
);
