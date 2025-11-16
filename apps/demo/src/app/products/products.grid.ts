import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { KENDO_BUTTONS } from '@progress/kendo-angular-buttons';
import { KENDO_DIALOG } from '@progress/kendo-angular-dialog';
import { ColumnMenuSettings, DataStateChangeEvent, GridState, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_ICONS } from '@progress/kendo-angular-icons';
import { CompositeFilterDescriptor } from '@progress/kendo-data-query';
import { SVGIcon, pencilIcon, plusIcon, trashIcon } from '@progress/kendo-svg-icons';
import { Subject } from 'rxjs';

import { Product } from './products.model';
import { ProductsStore } from './products.state';

@Component({
  selector: 'app-products-grid',
  imports: [KENDO_GRID, KENDO_BUTTONS, KENDO_ICONS, KENDO_DIALOG, CommonModule],
  template: `
<kendo-grid
  [columnMenu]="columnMenuSettings"
  [kendoGridBinding]="store['entities']()"
  [skip]="store['gridState']().skip ?? 0"
  [pageSize]="store['gridState']().take ?? 5"
  [sort]="store['gridState']().sort ?? []"
  [group]="store['gridState']().group ?? []"
  [filter]="store['gridState']().filter ?? emptyFilter"
  [pageable]="true"
  [sortable]="true"
  [groupable]="true"
  [reorderable]="true"
  [height]="480"
  (dataStateChange)="dataStateChange($event)"
  (gridStateChange)="gridStateChange($event)"
  filterable="menu"
  resizable="constrained"
>
  <!-- Toolbar with Add button -->
  <ng-template kendoGridToolbarTemplate>
    <button kendoButton [svgIcon]="createIcon" (click)="createProduct()" aria-label="Add"></button>
  </ng-template>

  <!-- Data Columns - 4 columns total: ID + 3 data columns -->
  <kendo-grid-column field="ProductId" title="ID" [width]="80"></kendo-grid-column>
  <kendo-grid-column field="ProductName" title="Product Name" [width]="200"></kendo-grid-column>
  <kendo-grid-column field="UnitPrice" title="Price" [width]="100"></kendo-grid-column>
  <kendo-grid-column field="UnitsInStock" title="Stock" [width]="80"></kendo-grid-column>

  <!-- Command Column with Edit/Remove buttons -->
  <kendo-grid-command-column title="Commands" [width]="160">
    <ng-template kendoGridCellTemplate let-dataItem>
      <button kendoButton [svgIcon]="updateIcon" [primary]="true" (click)="updateProduct(dataItem.ProductId)" aria-label="Edit">
      </button>
      <button kendoButton [svgIcon]="removeIcon" (click)="removeProduct(dataItem)" aria-label="Remove"></button>
    </ng-template>
  </kendo-grid-command-column>
</kendo-grid>
@if (itemToRemove) {
    <kendo-dialog title="Please confirm" (close)="confirmRemove(false)">
      <p style="margin: 30px; text-align: center;">
        Are you sure you want to delete product {{ itemToRemove.ProductName }}?
      </p>
      <kendo-dialog-actions>        
        <button kendoButton themeColor="primary" (click)="confirmRemove(true)">
          Yes
        </button>
        <button kendoButton (click)="confirmRemove(false)">No</button>
      </kendo-dialog-actions>
    </kendo-dialog>
    }
  `,
})
export class ProductsGrid {
  private router = inject(Router);
  public store = inject(ProductsStore);
  
  public removeConfirmationSubject: Subject<boolean> = new Subject<boolean>();
  public itemToRemove: Product | null = null;

  // Icons for command buttons
  public updateIcon: SVGIcon = pencilIcon;
  public removeIcon: SVGIcon = trashIcon;
  public createIcon: SVGIcon = plusIcon;

  public readonly emptyFilter: CompositeFilterDescriptor = {
    logic: 'and',
    filters: [],
  };

  // Column menu settings
  public columnMenuSettings: ColumnMenuSettings = {
    view: 'tabbed',
    lock: true,
    stick: true,
    setColumnPosition: { expanded: true },
    autoSizeColumn: true,
    autoSizeAllColumns: true,
    columnChooser: true,
    sort: true,
    filter: true,
  };

  constructor() {
    this.removeConfirmation = this.removeConfirmation.bind(this);
  }

  public createProduct(): void {
    this.router.navigate(['/products', 'new']);
  }

  public updateProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  public removeProduct(dataItem: Product): void {
    this.itemToRemove = dataItem;
  }

  public confirmRemove(shouldRemove: boolean): void {
    if (shouldRemove && this.itemToRemove) {
      const productId = this.itemToRemove.ProductId;
      console.log('🔵 confirmRemove: User CONFIRMED removal for product', productId);
      
      // Remove from store using withDataService-generated delete method
      // Note: delete expects the full entity, not just the ID
      this.store['delete'](this.itemToRemove);
      
      // Remove from server if it has a valid ProductId
      if (productId && productId.length > 0) {
        console.log('🔵 confirmRemove: Calling removeFromServer', productId);
        this.store['removeFromServer'](productId);
      } else {
        console.log('🔵 confirmRemove: Skipping server remove (unsaved row with empty ID)');
      }
    } else {
      console.log('🔵 confirmRemove: User CANCELLED removal');
    }
    
    this.removeConfirmationSubject.next(shouldRemove);
    this.itemToRemove = null;
  }

  public removeConfirmation(dataItem: Product): Subject<boolean> {
    this.itemToRemove = dataItem;
    return this.removeConfirmationSubject;
  }

  public dataStateChange(event: DataStateChangeEvent): void {
     if ('state' in event) {
      this.commitState(event.state as GridState);
     }
  }

  public gridStateChange(state: GridState): void {
    this.commitState(state);
  }

  private commitState(state: GridState): void {
    this.store['setGridState'](state);
  }
}
