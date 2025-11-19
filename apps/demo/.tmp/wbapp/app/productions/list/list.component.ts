import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Production } from '../store/productions.model';

@Component({
  selector: "productions-list-component",
  template: `
    <mat-nav-list>
      <mat-list-item 
      *ngFor="let item of list" 
      [style.background-color]="(item.Type === 'Add' || item.Type === null) ? 'white': '#a5c956'" 
      (click)=selectUProductionId.emit(item);> 
          <div matLine>
              {{ item.Block }} : ({{ item.Type ? item.Type : 'Add' }}) : {{ item.Date }}
          </div>
          <div matLine>
              {{ item.Description }} : ({{ item.Division }})
          </div>       
      </mat-list-item>
    </mat-nav-list>
  `
})
export class ListComponent {

  @Input() list: Production[];
  
  @Output() public selectUProductionId = new EventEmitter<Production>();

}

