import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthStore } from '@wbpwa/auth/data-access';
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
                formControlName="Email"
                fillMode="outline"
                [clearButton]="true"
              ></kendo-textbox>
            </kendo-floatinglabel>
            <kendo-formerror *ngIf="form.controls.Email.errors?.['required']">
              Email is required
            </kendo-formerror>
          </kendo-formfield>

          <kendo-formfield>
            <kendo-floatinglabel text="Password">
              <kendo-textbox
                formControlName="Password"
                fillMode="outline"
                type="password"
              ></kendo-textbox>
            </kendo-floatinglabel>
            <kendo-formerror *ngIf="form.controls.Password.errors?.['required']">
              Password is required
            </kendo-formerror>
          </kendo-formfield>



          <button
            kendoButton
            themeColor="primary"
            type="submit"
            [disabled]="form.invalid"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  form = new FormGroup({
    Email: new FormControl('steve@steve.com', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.email] 
    }),
    Password: new FormControl('Pass1234!', { 
      nonNullable: true, 
      validators: [Validators.required] 
    })
  });

  onSubmit() {
    if (this.form.valid) {
      const { Email, Password } = this.form.getRawValue();
      this.authStore.login({ email: Email, password: Password });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
