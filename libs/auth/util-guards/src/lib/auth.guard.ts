import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '@devils-offline/auth/data-access';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const injector = inject(Injector);

  // Convert signal to observable to wait for initialization
  return toObservable(authStore.isInitialized, { injector }).pipe(
    filter((isInitialized) => isInitialized),
    take(1),
    map(() => {
      if (authStore.isAuthenticated()) {
        return true;
      }

      // Redirect to login page with return url
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const injector = inject(Injector);

  return toObservable(authStore.isInitialized, { injector }).pipe(
    filter((isInitialized) => isInitialized),
    take(1),
    map(() => {
      if (authStore.isAuthenticated() && authStore.isAdmin()) {
        return true;
      }

      // Redirect to home if not admin
      return router.createUrlTree(['/']);
    })
  );
};
