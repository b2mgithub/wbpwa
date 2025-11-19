import { GridDataResult, EditEvent, SaveEvent, RemoveEvent, DataStateChangeEvent } from '@progress/kendo-angular-grid';
import { Input, Component, Output, EventEmitter } from '@angular/core';
import { State as GridState } from '@progress/kendo-data-query';

@Component({
  selector: "rates-component",
  templateUrl: "./rates.component.html"
})
export class RatesComponent {
  @Input() data: GridDataResult;
  @Input() gridState: GridState;
  @Input() editDataItem: any;

  @Output() public edit = new EventEmitter<EditEvent>();
  @Output() public dataStateChange = new EventEmitter<DataStateChangeEvent>();

}