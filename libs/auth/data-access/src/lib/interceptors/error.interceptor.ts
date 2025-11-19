import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth.store';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((err) => {
      if ([401, 403].includes(err.status) && authStore.user()) {
        // Auto logout if 401/403 response returned from api
        authStore.logout();
      }

      const error = err.error?.message || err.statusText;
      return throwError(() => error);
    })
  );
};
