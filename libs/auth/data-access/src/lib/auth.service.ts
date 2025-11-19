import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from './models';
import { API_URL } from './tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);
  // Auth endpoints are at {apiUrl}/Auth/*
  private baseUrl = `${this.apiUrl}/Auth`;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/authenticate`, { email, password });
  }

  refreshToken(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { token });
  }

  revokeToken(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/revoke-token`, { token });
  }
}
