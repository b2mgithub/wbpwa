import { GridDataResult, EditEvent, SaveEvent, RemoveEvent, DataStateChangeEvent } from '@progress/kendo-angular-grid';
import { Input, Component, Output, EventEmitter } from '@angular/core';
import { State as GridState } from '@progress/kendo-data-query';

@Component({
  selector: "users-component",
  templateUrl: "./users.component.html"
})
export class UsersComponent {
  @Input() data: GridDataResult;
  @Input() gridState: GridState;

  @Output() public add = new EventEmitter<void>();
  @Output() public edit = new EventEmitter<EditEvent>();
  @Output() public remove = new EventEmitter<RemoveEvent>();
  @Output() public dataStateChange = new EventEmitter<DataStateChangeEvent>();

}