import { InjectionToken } from '@angular/core';

/**
 * Injection token for the API base URL.
 * This allows the auth service to be environment-agnostic.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => {
    throw new Error('API_URL must be provided in app.config.ts');
  }
});
