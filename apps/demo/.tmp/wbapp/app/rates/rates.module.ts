import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatesComponent } from './rates.component';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '@b2m/auth';
import { RatesContainer } from './rates.container';
import { MaterialModule } from '@b2m/material';
import { GridModule } from '@progress/kendo-angular-grid';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { RatesGridEditFormComponent } from './rates.edit.component';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    RatesComponent,
    RatesContainer,
    RatesGridEditFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", component: RatesContainer, canActivate: [AuthGuard] }
    ]),
    FormsModule,
    MaterialModule,
    GridModule, 
    DialogsModule,
    InputsModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: "never" }),
  ]
})
export class RatesModule { }
