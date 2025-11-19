import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { updateState, withDevtools } from '@angular-architects/ngrx-toolkit';
import { Router } from '@angular/router';
import { authDB, devilsOfflineDB } from '@devils-offline/idb';

import { AuthService } from './auth.service';

// Flat AuthUser structure for storage and state
export interface AuthUser {
  AccessToken: string;
  RefreshToken: string;
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'User' | 'Admin';
  Division?: 'PG' | 'Mackenzie' | 'All';
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Global callback for eager data hydration
let _dataHydrationCallback: (() => Promise<void>) | null = null;

export function setDataHydrationCallback(callback: () => Promise<void>): void {
  _dataHydrationCallback = callback;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withDevtools('auth'),
  withState(initialState),
  
  withComputed(({ user }) => ({
    // Computed signals for easy access
    isAdmin: computed(() => user()?.Role === 'Admin'),
    accessToken: computed(() => user()?.AccessToken ?? null),
    refreshToken: computed(() => user()?.RefreshToken ?? null),
    userId: computed(() => user()?.UserId ?? null),
  })),

  withMethods((store) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      // Async login method using rxMethod
      login: rxMethod<{ email: string; password: string }>(
        pipe(
          tap(() => updateState(store, '[Auth] Login Start', {})),
          switchMap(({ email, password }) =>
            authService.login(email, password).pipe(
              tapResponse({
                next: async (response) => {
                  // Flatten the response into AuthUser
                  const authUser: AuthUser = {
                    ...response.User,
                    AccessToken: response.AccessToken,
                    RefreshToken: response.RefreshToken,
                  };

                  // Update state
                  updateState(store, '[Auth] Login Success', {
                    user: authUser,
                    isAuthenticated: true,
                  });

                  // Switch DB and persist to Reception Desk only
                  console.log('🔄 Switching database for user:', authUser.UserId);
                  try {
                    // Save to Auth DB (Reception Desk) - the ONLY auth persistence
                    await authDB.setCurrentUser(authUser);
                    console.log('✅ Auth saved to Reception Desk');
                    
                    // Switch to user-specific DB for data (products, productions, etc.)
                    await devilsOfflineDB.switchDatabase(authUser.UserId);
                    console.log('✅ User data database ready');
                    
                    // Call eager hydration callback if set
                    if (_dataHydrationCallback) {
                      await _dataHydrationCallback();
                    }
                  } catch (err) {
                    console.error('❌ Failed to save auth or switch database:', err);
                  }

                  console.log('🏠 Navigating to home');
                  router.navigate(['/']);
                },
                error: (err: Error) => {
                  console.error('Login failed', err);
                  updateState(store, '[Auth] Login Failed', {});
                },
              })
            )
          )
        )
      ),

      async logout() {
        console.log('🚪 Logout initiated');
        const token = store.user()?.RefreshToken;
        if (token) {
          authService.revokeToken(token).subscribe();
        }

        updateState(store, '[Auth] Logout', {
          user: null,
          isAuthenticated: false,
        });
        console.log('🚪 Auth state cleared in store');
        
        try {
          // Clear from Auth DB
          await authDB.clearCurrentUser();
          
          // Delete the user-specific DB
          await devilsOfflineDB.deleteCurrentDatabase();
          console.log('🚪 User database deleted');
        } catch (err) {
          console.error('Failed to clear auth state from IDB:', err);
        }

        router.navigate(['/login']);
      },

      async syncFromStorage() {
        try {
          console.log('🔄 Syncing auth from storage...');
          // Read from Auth DB (Reception Desk)
          const storedUser = await authDB.getCurrentUser<AuthUser>();
          console.log('🔄 Read stored user from Auth DB:', storedUser);
          
          if (storedUser) {
            console.log('🔄 Found existing session for user:', storedUser.UserId);
            // Switch to user-specific DB for data
            await devilsOfflineDB.switchDatabase(storedUser.UserId);
            
            updateState(store, '[Auth] Sync from Storage', {
              user: storedUser,
              isAuthenticated: true,
              isInitialized: true,
            });
            
            // Call eager hydration callback if set
            if (_dataHydrationCallback) {
              await _dataHydrationCallback();
            }
          } else {
            console.log('🔄 No existing user session found');
            updateState(store, '[Auth] Sync from Storage (No User)', {
              isInitialized: true,
            });
          }
        } catch (err) {
          console.error('Failed to sync auth state from IDB:', err);
          updateState(store, '[Auth] Sync from Storage (Error)', {
            isInitialized: true,
          });
        }
      }
    };
  }),

  withHooks({
    onInit(store) {
      store.syncFromStorage();
    },
  })
);
