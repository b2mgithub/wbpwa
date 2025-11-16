import { computed } from '@angular/core';

import { updateState, withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { getDbName } from '@devils-offline/idb';

interface AuthUser {
  Division: string;
  Email: string;
  EmailReport: boolean;
  FirstName: string;
  JwtToken: string;
  LastName: string;
  RefreshToken: string;
  Role: string;
  Roles: string[];
  UserId: string;
  UserName: string;
}

type UserState = {
  authUser: AuthUser | null;
};

const initialState: UserState = {
  authUser: null,
};

function loadAuthUserFromStorage(): AuthUser | null {
  try {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load authUser from localStorage:', error);
  }
  return null;
}

export const UserStore = signalStore(
  { providedIn: 'root' },
  withDevtools('user'),

  withState(() => ({
    ...initialState,
    authUser: loadAuthUserFromStorage(),
  })),

  withComputed(({ authUser }) => ({
    userId: computed(() => authUser()?.UserId ?? null),
    userName: computed(() => authUser()?.UserName ?? null),
    fullName: computed(() => {
      const user = authUser();
      return user ? `${user.FirstName} ${user.LastName}` : null;
    }),
    isAuthenticated: computed(() => authUser() !== null),
  })),

  withMethods((store) => {
    return {
      setAuthUser(user: AuthUser) {
        updateState(store, 'setAuthUser', { authUser: user });
        localStorage.setItem('authUser', JSON.stringify(user));
      },

      async switchUser(user: AuthUser) {
        // Get old database name before switching user
        const oldDbName = getDbName();
        
        // Update user
        updateState(store, 'switchUser', { authUser: user });
        localStorage.setItem('authUser', JSON.stringify(user));
        
        // Delete old database for previous user
        try {
          console.log(`🗑️ Deleting database: ${oldDbName}`);
          await indexedDB.deleteDatabase(oldDbName);
          console.log(`✅ Database deleted: ${oldDbName}`);
        } catch (error) {
          console.error(`❌ Failed to delete database ${oldDbName}:`, error);
        }
        
        // Reload the page to reinitialize with new user's database
        window.location.reload();
      },

      clearAuthUser() {
        updateState(store, 'clearAuthUser', { authUser: null });
        localStorage.removeItem('authUser');
      },
    };
  })
);
