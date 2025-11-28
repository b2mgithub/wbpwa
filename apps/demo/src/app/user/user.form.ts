import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DROPDOWNS } from '@progress/kendo-angular-dropdowns';
import { KENDO_INPUTS, FormFieldModule } from '@progress/kendo-angular-inputs';
import { FloatingLabelModule, KENDO_LABEL } from '@progress/kendo-angular-label';

import { generateGuid } from '@wbpwa/guid';

import { User } from './user.model';
import { UsersStore } from './user.state';

@Component({
  selector: 'app-users-form',
  imports: [
    ReactiveFormsModule,
    KENDO_BUTTONS,
    KENDO_INPUTS,
    KENDO_LABEL,
    KENDO_DROPDOWNS,
    FloatingLabelModule,
    FormFieldModule
  ],
  template: `
    <div class="outline-form">
      <h2>{{ isCreateMode ? 'Create User' : 'Update User' }}</h2>
      <form [formGroup]="form" (ngSubmit)="save()" autocomplete="off">
        <div class="outline-div">
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Email">
              <kendo-textbox
                formControlName="Email"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="First Name">
              <kendo-textbox
                formControlName="FirstName"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Last Name">
              <kendo-textbox
                formControlName="LastName"
                fillMode="outline"
                required
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Role">
              <kendo-dropdownlist
                formControlName="Role"
                fillMode="outline"
                [data]="roles"
              ></kendo-dropdownlist>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Division">
              <kendo-dropdownlist
                formControlName="Division"
                fillMode="outline"
                [data]="divisions"
              ></kendo-dropdownlist>
            </kendo-floatinglabel>
          </kendo-formfield>
          <kendo-formfield>
            <kendo-floatinglabel class="outline" text="Password">
              <kendo-textbox
                formControlName="Password"
                fillMode="outline"
                type="password"
              ></kendo-textbox>
            </kendo-floatinglabel>
          </kendo-formfield>
        </div>
        <div class="button-group">
          <button kendoButton themeColor="primary" type="submit">
            Save
          </button>
          <button kendoButton type="button" (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `
})
export class UsersForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public store = inject(UsersStore);

  userId: string | null = null;
  isCreateMode = true;

  roles = ['User', 'Admin'];
  divisions = ['PG', 'Mackenzie', 'All'];

  form = new FormGroup({
    Email: new FormControl('', { nonNullable: true }),
    FirstName: new FormControl('', { nonNullable: true }),
    LastName: new FormControl('', { nonNullable: true }),
    Role: new FormControl<'User' | 'Admin'>('User', { nonNullable: true }),
    Division: new FormControl<'PG' | 'Mackenzie' | 'All'>('All', { nonNullable: true }),
    Password: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.isCreateMode = false;
      this.userId = id;
      const user = this.store['entities']().find((u: User) => u.UserId === id);

      if (user) {
        this.form.patchValue({
          Email: user.Email,
          FirstName: user.FirstName,
          LastName: user.LastName,
          Role: user.Role,
          Division: user.Division || 'All',
          Password: ''
        });
        this.form.markAsPristine();
      } else {
        this.router.navigate(['/user']);
      }
    }
  }

  async save(): Promise<void> {
    const formValue = this.form.getRawValue();

    if (!formValue.Email || !formValue.FirstName) {
      console.warn('Email and First Name are required');
      return;
    }

    if (this.isCreateMode) {
      const newId = generateGuid();
      const newUser: User = {
        id: newId,
        UserId: newId,
        Email: formValue.Email,
        FirstName: formValue.FirstName,
        LastName: formValue.LastName,
        Role: formValue.Role,
        Division: formValue.Division,
        Password: formValue.Password
      };
      await this.store['create'](newUser);
      this.store['createToServer'](newUser);
    } else if (this.userId) {
      const existingUser = this.store['entities']().find((u: User) => u.UserId === this.userId);
      if (!existingUser) {
        return;
      }

      const updatedUser: User = {
        ...existingUser,
        Email: formValue.Email,
        FirstName: formValue.FirstName,
        LastName: formValue.LastName,
        Role: formValue.Role,
        Division: formValue.Division,
        ...(formValue.Password && { Password: formValue.Password })
      };
      await this.store['update'](updatedUser);
      this.store['updateToServer'](this.userId, updatedUser);
    }

    this.router.navigate(['/user']);
  }

  cancel(): void {
    this.router.navigate(['/user']);
  }
}
