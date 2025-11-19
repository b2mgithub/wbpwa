# Angular Integration with Devils Offline Auth API

## Complete Integration Guide

This guide shows how to integrate your existing Angular SignalStore auth with the new .NET 9 API.

## 1. Update auth.service.ts

```typescript
// libs/auth/data-access/src/lib/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Match the .NET API response format
interface ApiAuthResponse {
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'User' | 'Admin';
    division?: 'PG' | 'Mackenzie' | 'All';
    isVerified: boolean;
    createdAt: string;
  };
  accessToken: string;
}

// Your existing interface
export interface AuthResponse {
  User: {
    UserId: string;
    Email: string;
    FirstName: string;
    LastName: string;
    Role: 'User' | 'Admin';
    Division?: 'PG' | 'Mackenzie' | 'All';
  };
  AccessToken: string;
  RefreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api/auth'; // Change in production

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiAuthResponse>(`${this.baseUrl}/login`, { 
      email, 
      password 
    }, {
      withCredentials: true // IMPORTANT: Send/receive cookies
    }).pipe(
      map(response => ({
        User: {
          UserId: response.user.userId,
          Email: response.user.email,
          FirstName: response.user.firstName,
          LastName: response.user.lastName,
          Role: response.user.role,
          Division: response.user.division,
        },
        AccessToken: response.accessToken,
        RefreshToken: '' // Not sent in body, in cookie
      }))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<ApiAuthResponse>(`${this.baseUrl}/refresh-token`, {}, {
      withCredentials: true // Send refresh token cookie
    }).pipe(
      map(response => ({
        User: {
          UserId: response.user.userId,
          Email: response.user.email,
          FirstName: response.user.firstName,
          LastName: response.user.lastName,
          Role: response.user.role,
          Division: response.user.division,
        },
        AccessToken: response.accessToken,
        RefreshToken: ''
      }))
    );
  }

  revokeToken(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/revoke-token`, {}, {
      withCredentials: true
    });
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    division?: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/register`, data);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/verify-email`, { token });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { 
      token, 
      password 
    });
  }
}
```

## 2. Update auth.store.ts

Your existing `auth.store.ts` is already perfect! No changes needed. It uses:

✅ `authDB.setCurrentUser()` - Reception Desk persistence  
✅ `devilsOfflineDB.switchDatabase()` - User data DB  
✅ SignalStore for reactive state  
✅ Computed signals (`isAdmin`, `accessToken`, etc.)

The only change needed is in the `login` method to handle the new response format (already shown above).

## 3. Update jwt.interceptor.ts

No changes needed! Your existing interceptor already works:

```typescript
// libs/auth/data-access/src/lib/interceptors/jwt.interceptor.ts
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.accessToken();
  const isApiUrl = req.url.startsWith('/api') || req.url.startsWith('http://localhost:5000');

  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true // Add this for cookies
    });
  }

  return next(req);
};
```

## 4. Update error.interceptor.ts

No changes needed! Your existing error interceptor works perfectly.

## 5. Add User Management Service (Optional)

If you want admin user management:

```typescript
// libs/auth/data-access/src/lib/user-management.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'User' | 'Admin';
  division?: 'PG' | 'Mackenzie' | 'All';
  isVerified: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api/users';

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  update(id: string, data: Partial<User>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
```

## 6. Add Forgot Password Components

### Forgot Password Page

```typescript
// libs/auth/feature-forgot-password/src/lib/forgot-password.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { AuthService } from '@devils-offline/auth/data-access';
import { Router } from '@angular/router';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL, FloatingLabelModule } from '@progress/kendo-angular-label';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';

@Component({
  selector: 'lib-forgot-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    KENDO_INPUTS, 
    KENDO_LABEL, 
    KENDO_BUTTONS,
    FloatingLabelModule
  ],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <h2>Forgot Password</h2>
        
        @if (submitted()) {
          <div class="success-message">
            <p>✅ {{ message() }}</p>
            <button kendoButton themeColor="primary" (click)="router.navigate(['/login'])">
              Back to Login
            </button>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <kendo-floatinglabel text="Email">
              <kendo-textbox
                [formControl]="emailControl"
                fillMode="outline"
                [clearButton]="true"
              ></kendo-textbox>
            </kendo-floatinglabel>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button
              kendoButton
              themeColor="primary"
              type="submit"
              [disabled]="emailControl.invalid || loading()"
            >
              {{ loading() ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <button
              kendoButton
              themeColor="base"
              type="button"
              (click)="router.navigate(['/login'])"
            >
              Back to Login
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .forgot-password-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }

    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    button {
      width: 100%;
    }

    .success-message {
      text-align: center;
    }

    .success-message p {
      margin-bottom: 1rem;
      color: #4caf50;
    }

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
    }
  `]
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  readonly router = inject(Router);

  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email]
  });

  loading = signal(false);
  error = signal('');
  message = signal('');
  submitted = signal(false);

  onSubmit() {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.forgotPassword(this.emailControl.value).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.submitted.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to send reset email');
        this.loading.set(false);
      }
    });
  }
}
```

### Reset Password Page

```typescript
// libs/auth/feature-reset-password/src/lib/reset-password.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@devils-offline/auth/data-access';
import { KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL, FloatingLabelModule } from '@progress/kendo-angular-label';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';

@Component({
  selector: 'lib-reset-password',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    KENDO_INPUTS, 
    KENDO_LABEL, 
    KENDO_BUTTONS,
    FloatingLabelModule
  ],
  template: `
    <div class="reset-password-container">
      <div class="reset-password-card">
        <h2>Reset Password</h2>
        
        @if (success()) {
          <div class="success-message">
            <p>✅ Password reset successful!</p>
            <button kendoButton themeColor="primary" (click)="router.navigate(['/login'])">
              Go to Login
            </button>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <kendo-floatinglabel text="New Password">
              <kendo-textbox
                formControlName="password"
                type="password"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>

            <kendo-floatinglabel text="Confirm Password">
              <kendo-textbox
                formControlName="confirmPassword"
                type="password"
                fillMode="outline"
              ></kendo-textbox>
            </kendo-floatinglabel>

            @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
              <div class="error-message">Passwords do not match</div>
            }

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button
              kendoButton
              themeColor="primary"
              type="submit"
              [disabled]="form.invalid || loading()"
            >
              {{ loading() ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
    }

    .reset-password-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }

    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    button {
      width: 100%;
    }

    .success-message {
      text-align: center;
    }

    .success-message p {
      margin-bottom: 1rem;
      color: #4caf50;
    }

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  token = '';
  loading = signal(false);
  error = signal('');
  success = signal(false);

  form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.error.set('Invalid or missing reset token');
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { password } = this.form.getRawValue();

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to reset password');
        this.loading.set(false);
      }
    });
  }
}
```

## 7. Update Routing

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from '@devils-offline/auth/util-guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@devils-offline/auth/feature-login').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('@devils-offline/auth/feature-forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('@devils-offline/auth/feature-reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Your protected routes
    ]
  }
];
```

## 8. Add Link to Login Page

Update your login component to include forgot password link:

```typescript
// In login.component.ts template, after the Sign In button:
<div class="forgot-password-link">
  <a [routerLink]="['/forgot-password']">Forgot your password?</a>
</div>
```

## 9. Environment Configuration

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};

// src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

Update auth.service.ts:

```typescript
private baseUrl = `${environment.apiUrl}/auth`;
```

## 10. Testing Checklist

### Development Testing

- [ ] Register new user
- [ ] Verify email (check Ethereal inbox)
- [ ] Login with verified user
- [ ] JWT token stored in SignalStore
- [ ] Refresh token stored in cookie
- [ ] User data in Reception Desk IDB
- [ ] User-specific DB created
- [ ] Navigate to protected route
- [ ] Refresh page (should stay logged in)
- [ ] Request forgot password
- [ ] Check Ethereal inbox for reset email
- [ ] Click reset link
- [ ] Reset password successfully
- [ ] Login with new password
- [ ] Logout
- [ ] Auth cleared from Reception Desk
- [ ] User DB deleted

### Admin Testing

- [ ] Login as admin
- [ ] Access admin-only route
- [ ] View all users
- [ ] Update user role
- [ ] Delete user
- [ ] Logout

## Common Integration Issues

### Issue: CORS Error
**Solution:** Update .NET API CORS policy to include your Angular URL:

```csharp
// In Program.cs
app.UseCors(x => x
    .WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

### Issue: Refresh token not sent
**Solution:** Ensure `withCredentials: true` in all HTTP requests:

```typescript
this.http.post(url, data, { withCredentials: true })
```

### Issue: Token not found in cookie
**Solution:** Check browser DevTools → Application → Cookies → `refreshToken` should be present

### Issue: JWT expires immediately
**Solution:** Implement automatic token refresh in your auth interceptor

## Production Deployment

### Angular Build
```bash
nx build your-app --configuration=production
```

### Update API URL
Use environment variables or config service to point to production API.

### HTTPS Required
Both Angular app and .NET API must use HTTPS in production for secure cookies.

## Next Steps

1. ✅ Test complete auth flow locally
2. ✅ Test forgot password flow
3. ✅ Test with multiple users
4. ✅ Test admin vs user permissions
5. ✅ Deploy to staging
6. ✅ Configure production SMTP
7. ✅ Deploy to production
8. ✅ Monitor and celebrate! 🎉
