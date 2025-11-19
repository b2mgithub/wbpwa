import { computed, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from './models';
import { Router } from '@angular/router';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
};

// Load auth data from single localStorage key
const loadAuthState = (): Partial<AuthState> => {
  const authData = localStorage.getItem('AuthUser');
  if (!authData) return { user: null, accessToken: null, refreshToken: null };
  
  try {
    const parsed = JSON.parse(authData);
    return {
      user: parsed.User || null,
      accessToken: parsed.AccessToken || null,
      refreshToken: parsed.RefreshToken || null,
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

const initialState: AuthState = {
  ...loadAuthState(),
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
    isAdmin: computed(() => user()?.Role === 'Admin'),
  })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
    login: rxMethod<{ email: string; password: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ email, password }) =>
          authService.login(email, password).pipe(
            tapResponse({
              next: (response) => {
                // Store all auth data in single key
                localStorage.setItem('AuthUser', JSON.stringify(response));
                patchState(store, {
                  user: response.User,
                  accessToken: response.AccessToken,
                  refreshToken: response.RefreshToken,
                  isLoading: false,
                });
                router.navigate(['/']);
              },
              error: (err: any) => {
                patchState(store, {
                  isLoading: false,
                  error: err?.error?.message || 'Login failed',
                });
              },
            })
          )
        )
      )
    ),
    logout: () => {
      const token = store.refreshToken();
      if (token) {
        authService.revokeToken(token).subscribe();
      }
      // Single key cleanup
      localStorage.removeItem('AuthUser');
      patchState(store, { user: null, accessToken: null, refreshToken: null });
      router.navigate(['/login']);
    },
  }))
);
