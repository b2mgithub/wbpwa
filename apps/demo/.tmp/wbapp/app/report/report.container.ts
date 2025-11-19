import { Component, OnInit } from "@angular/core";
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { selectReport } from './store/report.selectors';
import { selectRouteDate } from '@b2m/router';
import { BlocksEntityService } from '../blocks/store/blocks.entity-service';
import { ProductionsEntityService } from '../productions/store/productions.entity-service';
import { RatesEntityService } from '@app/rates/store/rates.entity-service';

@Component({
  selector: 'wbapp-report',
  template: `
  <div class="container">
    <mat-progress-bar *ngIf="loading$ | async" mode="indeterminate"></mat-progress-bar>
    <report-component [list]="list$ | async"></report-component>
    <b2m-dateselectbar [currentDate]="currentDate$ | async"(dateChanged)="onDateChanged($event)"></b2m-dateselectbar>
  </div>
  `
})
export class ReportContainer implements  OnInit {
  list$: Observable<any>;
  currentDate$: Observable<Date>;
  loading$: Observable<boolean>;
 
  constructor(
    private store: Store,
    private router: Router, 
    private blocksEntityService: BlocksEntityService,
    private productionsEntityService: ProductionsEntityService,
    private rateEntityService: RatesEntityService
  ) {}

  ngOnInit() { 
    this.list$ = this.store.pipe(select(selectReport));
    this.currentDate$ = this.store.pipe(select(selectRouteDate));
    this.loading$ = combineLatest([this.blocksEntityService.loading$, this.productionsEntityService.loading$, this.rateEntityService.loading$]).pipe(
      map(([blocksLoading, productionsLoading, ratesLoading]) => blocksLoading || productionsLoading || ratesLoading)
    )
    this.blocksEntityService.load();
    this.productionsEntityService.load();
    this.rateEntityService.load();
  }
  
  onDateChanged(date: Date): void {
    console.log("onDateChanged", formatDate(date, 'yyyy-MM-dd', 'en-US'));
    this.router.navigate(["report", formatDate(date, 'yyyy-MM-dd', 'en-US')]);
  } 
}
