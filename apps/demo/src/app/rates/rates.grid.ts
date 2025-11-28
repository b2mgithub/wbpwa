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

import { Rate } from './rates.model';
import { RatesStore } from './rates.state';

@Component({
  selector: 'app-rates-grid',
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
    <button kendoButton [svgIcon]="createIcon" (click)="createRate()" aria-label="Add"></button>
  </ng-template>

  <!-- Data Columns -->
  <kendo-grid-column field="RateId" title="ID" [width]="80"></kendo-grid-column>
  <kendo-grid-column field="Type" title="Type" [width]="120"></kendo-grid-column>
  <kendo-grid-column field="SubType" title="Sub Type" [width]="120"></kendo-grid-column>
  <kendo-grid-column field="RateValue" title="Rate" [width]="100" format="{0:c}"></kendo-grid-column>

  <!-- Command Column with Edit/Remove buttons -->
  <kendo-grid-command-column title="Commands" [width]="160">
    <ng-template kendoGridCellTemplate let-dataItem>
      <button kendoButton [svgIcon]="updateIcon" [primary]="true" (click)="updateRate(dataItem.RateId)" aria-label="Edit">
      </button>
      <button kendoButton [svgIcon]="removeIcon" (click)="removeRate(dataItem)" aria-label="Remove"></button>
    </ng-template>
  </kendo-grid-command-column>
</kendo-grid>
@if (itemToRemove) {
    <kendo-dialog title="Please confirm" (close)="confirmRemove(false)">
      <p style="margin: 30px; text-align: center;">
        Are you sure you want to delete Rate {{ itemToRemove.RateId }}?
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
export class RatesGrid {
  private router = inject(Router);
  public store = inject(RatesStore);
  
  public removeConfirmationSubject: Subject<boolean> = new Subject<boolean>();
  public itemToRemove: Rate | null = null;

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

  public createRate(): void {
    this.router.navigate(['/rates', 'new']);
  }

  public updateRate(RateId: string): void {
    this.router.navigate(['/rates', RateId]);
  }

  public removeRate(dataItem: Rate): void {
    this.itemToRemove = dataItem;
  }

  public confirmRemove(shouldRemove: boolean): void {
    if (shouldRemove && this.itemToRemove) {
      const RateId = this.itemToRemove.RateId;
      console.log('🔵 confirmRemove: User CONFIRMED removal for Rate', RateId);
      
      this.store['delete'](this.itemToRemove);
      
      if (RateId && RateId.length > 0) {
        console.log('🔵 confirmRemove: Calling removeFromServer', RateId);
        this.store['removeFromServer'](RateId);
      } else {
        console.log('🔵 confirmRemove: Skipping server remove (unsaved row with empty ID)');
      }
    } else {
      console.log('🔵 confirmRemove: User CANCELLED removal');
    }
    
    this.removeConfirmationSubject.next(shouldRemove);
    this.itemToRemove = null;
  }

  public removeConfirmation(dataItem: Rate): Subject<boolean> {
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
