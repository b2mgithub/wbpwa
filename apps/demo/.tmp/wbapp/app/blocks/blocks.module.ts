import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from '@b2m/material';

import { IntlModule } from '@progress/kendo-angular-intl';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { TreeViewModule } from '@progress/kendo-angular-treeview';
import { GridModule } from '@progress/kendo-angular-grid';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';

import { BlocksContainer } from './component/blocks.container';
import { BlocksComponent } from './component/blocks.component';
import { ProductionComponent } from './child/productions.component';
import { ProductionsGridEditFormComponent } from './child/productions.edit.component';
import { NgVirtualKeyboardModule } from '../virtual-keyboard/virtual-keyboard.module';
import { AuthGuard } from '@b2m/auth';
import { UiModule } from '@b2m/ui';
import { BlocksGridEditFormContainer } from './component/blocks.edit.container';


@NgModule({
  declarations: [
    BlocksContainer, 
    BlocksComponent, 
    ProductionsGridEditFormComponent, 
    BlocksGridEditFormContainer,
    ProductionComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "add", component: BlocksContainer, canActivate: [AuthGuard]  },
      { path: "edit/:id", component: BlocksContainer, canActivate: [AuthGuard] },
      { path: ":active", component: BlocksContainer, canActivate: [AuthGuard] },
    ]),
    FormsModule,
    IntlModule, 
    DateInputsModule,
    InputsModule,
    LayoutModule,
    TreeViewModule,
    NgVirtualKeyboardModule,
    MaterialModule,
    GridModule,      
    DialogsModule,
    SortableModule,
    ButtonsModule,
    DropDownsModule,
    UiModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: "never" }),
  ],  
  providers: [
  ]  
})
export class BlocksModule {
  constructor() {
  }
}
