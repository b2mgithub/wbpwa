import { Store } from '@ngrx/store';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { Component, OnInit, Input } from '@angular/core';
import { State as GridState, process } from '@progress/kendo-data-query';
import { GridDataResult, DataStateChangeEvent } from '@progress/kendo-angular-grid';
import { Guid } from 'guid-typescript';

import { Production } from '../../productions/store/productions.model';
import { map, catchError } from 'rxjs/operators';
import { ProductionsEntityService } from '../../productions/store/productions.entity-service';
import { Block } from '../store/blocks.model';

@Component({
    selector: "wbapp-productions-child",
    templateUrl: './productions.component.html'
})

export class ProductionComponent implements OnInit {
  public gridState$: BehaviorSubject<GridState> = new BehaviorSubject<GridState>({
    skip: 0,
    take: 5,
    filter: { filters: [], logic: 'or' },
    //filter: { filters: [{ field:'UBlockId', operator:'eq', value: 27 }], logic: 'and' },
    group: [],
    sort: []
  });
  public view$: Observable<GridDataResult>;
  public editDataItem: Production;
  public isNew: boolean;

  @Input() public block: Block;

  constructor(
    private store: Store<any>,
    private productionsEntityService: ProductionsEntityService,
  ) {}

  public ngOnInit(): void {
    console.log('this.block', this.block);
    console.log('gridState from ngOnInit', JSON.stringify(this.gridState$));
    //console.log('toDataSourceRequestString from ngOnInit', toDataSourceRequestString(this.gridState$));

    this.gridState$.next({
      skip: 0,
      take: 5,
      filter: { filters: [{ field:'UBlockId', operator:'eq', value:this.block.UBlockId }], logic: 'and' },
      group: [],
      sort: []
    });
    console.log('NEW gridState from ngOnInit', JSON.stringify(this.gridState$));

    this.view$ = combineLatest([this.productionsEntityService.entities$, this.gridState$]).pipe(
      map(([data, state]) => process(data, state)),
      catchError(err => {
        console.log(err);
        return of({ data: [], total: 0 })
      })
    );
  }

  public dataStateChange(state: DataStateChangeEvent): void {
    this.gridState$.next({...state});
    console.log('gridState from DataStateChangeEvent', JSON.stringify(this.gridState$));
    //this.view = this.store.select(fromStore.selectProductionsGridState, this.gridState);
  }

  public addHandler() {
    this.editDataItem = new Production();
    this.editDataItem.UProductionId = Guid.create().toString();
    this.editDataItem.UBlockId = this.block.UBlockId;
    this.isNew = true;
  }

  public editHandler({ dataItem }) {
    const fixedDates = { ...dataItem, "StartDate": new Date(dataItem['StartDate']), "EndDate": new Date(dataItem['EndDate']), "Date": new Date(dataItem['Date']) };
    console.log('productions fixedDates after', JSON.stringify(fixedDates));
    this.editDataItem = fixedDates;
    this.isNew = false;
  }

  public cancelHandler() {
    this.editDataItem = undefined;
  }

  public saveHandler(production: Production) {
    production.TimeStamp = new Date();
    if(this.isNew){
        console.log('Production dispatched to createProduction Action', production);
        this.productionsEntityService.add(production);
    }
    else{
        //const { UProductionId, ...changes } = production
        this.productionsEntityService.update(production);
    }
    this.editDataItem = undefined;
  }

  public removeHandler({dataItem}) {
    this.productionsEntityService.delete(dataItem);
  }
}
