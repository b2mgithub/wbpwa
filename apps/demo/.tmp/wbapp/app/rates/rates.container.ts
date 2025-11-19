import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GridDataResult, DataStateChangeEvent} from '@progress/kendo-angular-grid';
import { State as GridState, toDataSourceRequest } from '@progress/kendo-data-query';
import { Rate } from './store/rate.model';
import { Store, select } from '@ngrx/store';
import { Router } from '@angular/router';
import { RatesEntityService } from './store/rates.entity-service';
import { selectRouteGridState } from '@b2m/router';
import { selectGridRates } from './store/rates.selectors';

@Component({
  selector: 'wbapp-rates-container',
  template: `
    <mat-progress-bar *ngIf="loading$ | async" mode="indeterminate"></mat-progress-bar>
    <rates-component
      [data]="data$ | async"
      [gridState] ="gridState$ | async"
      [editDataItem]="editDataItem"
      (edit)="editHandler($event)"
      (dataStateChange)="gridStateChange($event)"
    ></rates-component>
    <wbapp-rates-edit [model]="editDataItem"
      (save)="saveHandler($event)"
      (cancel)="cancelHandler()">
    </wbapp-rates-edit>
  `
})

export class RatesContainer implements OnInit {
  public data$: Observable<GridDataResult>;
  public gridState$: Observable<GridState>;
  public editDataItem: Rate;
  public loading$: Observable<boolean>;

  constructor(
    private store: Store,
    private router: Router,
    private ratesEntityService: RatesEntityService,
  ) {}

  public ngOnInit(): void {    
    this.data$ = this.store.pipe(select(selectGridRates));
    this.gridState$ = this.store.pipe(select(selectRouteGridState()));
    this.loading$ = this.ratesEntityService.loading$;
    this.ratesEntityService.load();
  }

  public gridStateChange(state: DataStateChangeEvent): void {
    this.router.navigate(['rates'], {queryParams: toDataSourceRequest(state)});
  }

  public editHandler({ dataItem }) {
    this.editDataItem = dataItem;
  }

  public cancelHandler() {
    this.editDataItem = undefined;
  }

  public saveHandler(rate: Rate) {
    rate.TimeStamp = new Date()
    console.log('Rate dispatched to update(Rate) Service', rate);
    this.ratesEntityService.update(rate);
    this.editDataItem = undefined;
  }
}

