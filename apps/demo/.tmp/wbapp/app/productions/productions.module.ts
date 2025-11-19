import { CommonModule, formatDate } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from '@b2m/material';

import { LayoutModule } from '@progress/kendo-angular-layout';
import { TreeViewModule } from '@progress/kendo-angular-treeview';
import { GridModule } from '@progress/kendo-angular-grid';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { SortableModule } from '@progress/kendo-angular-sortable';

import { ListContainer } from "./list/list.container";
import { ListComponent } from "./list/list.component";
import { EditContainer } from "./edit/edit.container";
import { EditComponent } from './edit/edit.component';
import { NgVirtualKeyboardModule } from '../virtual-keyboard/virtual-keyboard.module';
import { AuthGuard } from '@b2m/auth';
import { UiModule } from '@b2m/ui';

@NgModule({
  declarations: [ListContainer, ListComponent, EditContainer, EditComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", redirectTo: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'), pathMatch: 'full' },
      { path: ":Date", component: ListContainer, canActivate: [AuthGuard] },
      { path: "edit/:ID", component: EditContainer, canActivate: [AuthGuard] },
      { path: "add/:ID", component: EditContainer, canActivate: [AuthGuard] },
    ]),
    FormsModule,
    MaterialModule,
    NgVirtualKeyboardModule,
    LayoutModule,
    TreeViewModule,
    GridModule,      
    DialogsModule,
    SortableModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: "never" }),
    UiModule,
  ],  
  providers: []
})
export class ProductionsModule {}
