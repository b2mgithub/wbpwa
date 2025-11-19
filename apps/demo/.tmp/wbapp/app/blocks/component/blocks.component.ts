import { Component, Input, Output, EventEmitter } from '@angular/core';
import { State as GridState } from '@progress/kendo-data-query';
import { DataStateChangeEvent, RemoveEvent, EditEvent, GridDataResult } from '@progress/kendo-angular-grid';


@Component({
  selector: "wbapp-blocks-component",
  templateUrl: "./blocks.component.html"
})
export class BlocksComponent {

  @Input() data: GridDataResult;
  @Input() gridState: GridState;

  @Output() public add = new EventEmitter<void>();
  @Output() public edit = new EventEmitter<EditEvent>();
  @Output() public remove = new EventEmitter<RemoveEvent>();
  @Output() public dataStateChange = new EventEmitter<DataStateChangeEvent>();

}