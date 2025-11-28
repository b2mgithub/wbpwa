import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth.store';
import { API_URL } from '../tokens';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const apiUrl = inject(API_URL);
  const token = authStore.accessToken();
  
  // Check if the request is to our API
  const isApiRequest = req.url.startsWith(apiUrl);

  if (token && isApiRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
