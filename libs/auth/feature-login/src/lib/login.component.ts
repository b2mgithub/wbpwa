import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthStore } from '@devils-offline/auth/data-access';
import { FormFieldModule, KENDO_INPUTS } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, KENDO_INPUTS, KENDO_LABEL, KENDO_BUTTONS, FormFieldModule, FloatingLabelModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Sign In</h2>
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <kendo-formfield>
            <kendo-floatinglabel text="Email">
              <kendo-textbox
                formControlName="email"
                fillMode="outline"
                [clearButton]="true"
              ></kendo-textbox>
            </kendo-floatinglabel>
            <kendo-formerror *ngIf="form.controls.email.errors?.['required']">
              Email is required
            </kendo-formerror>
          </kendo-formfield>

          <kendo-formfield>
            <kendo-floatinglabel text="Password">
              <kendo-textbox
                formControlName="password"
                fillMode="outline"
                type="password"
              ></kendo-textbox>
            </kendo-floatinglabel>
            <kendo-formerror *ngIf="form.controls.password.errors?.['required']">
              Password is required
            </kendo-formerror>
          </kendo-formfield>

          <div class="error-message" *ngIf="authStore.error()">
            {{ authStore.error() }}
          </div>

          <button
            kendoButton
            themeColor="primary"
            type="submit"
            [disabled]="form.invalid || authStore.isLoading()"
          >
            {{ authStore.isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        
        <div class="test-credentials">
          <p><strong>Admin:</strong> steve@wbenterprises.ca / password</p>
          <p><strong>User:</strong> user@test.com / password</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    h2 {
      margin-bottom: 1.5rem;
      text-align: center;
      color: #333;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .error-message {
      color: #d9534f;
      text-align: center;
      font-size: 0.9rem;
    }
    .test-credentials {
      margin-top: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #666;
    }
    button {
      margin-top: 1rem;
    }
  `]
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  form = new FormGroup({
    email: new FormControl('steve@wbenterprises.ca', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.email] 
    }),
    password: new FormControl('password', { 
      nonNullable: true, 
      validators: [Validators.required] 
    })
  });

  onSubmit() {
    if (this.form.valid) {
      const { email, password } = this.form.getRawValue();
      this.authStore.login({ email, password });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
