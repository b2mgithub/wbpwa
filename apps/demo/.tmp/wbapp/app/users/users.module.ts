import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GridModule } from '@progress/kendo-angular-grid';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { AuthGuard } from '@b2m/auth';
import { MaterialModule } from '@b2m/material';

import { UsersGridEditFormComponent } from './users.edit.component';
import { UsersComponent } from './users.component';
import { UsersContainer } from './users.container';

@NgModule({
  declarations: [
    UsersComponent,
    UsersContainer,
    UsersGridEditFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", component: UsersContainer, canActivate: [AuthGuard] }
    ]),
    FormsModule,
    MaterialModule,
    GridModule, 
    DialogsModule,
    DropDownsModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: "never" }),
  ]
})
export class UsersModule { }
