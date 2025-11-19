import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";

import { Production } from "../store/productions.model";
import { selectRouteDate } from '@b2m/router';
import { selectCurrentProductions } from '../store/productions.selectors';
import { ProductionsEntityService } from '../store/productions.entity-service';
import { BlocksEntityService } from '@app/blocks/store/blocks.entity-service';
import { reconnectSignalRHub } from 'ngrx-signalr-core';

//data-cy is a property used in e2e testing to identify elements even if they are renamed
@Component({
  selector: "list-container",
  template: `
    <div class="container">
      <mat-progress-bar *ngIf="loading$ | async" mode="indeterminate"></mat-progress-bar>
      <productions-list-component data-cy="productions-list" [list]="list$ | async" (selectUProductionId)="onSelectUProductionId($event)"></productions-list-component>
      <b2m-dateselectbar [currentDate]="currentDate$ | async"(dateChanged)="onDateChanged($event)"></b2m-dateselectbar>
    </div>
  `
})
export class ListContainer implements OnInit{
  list$?: Observable<Production[]>;
  currentDate$: Observable<Date>;
  loading$: Observable<boolean>;
  
  constructor(
    private store: Store,
    private router: Router,
    private blocksEntityService: BlocksEntityService,
    private productionsEntityService: ProductionsEntityService, 
    ) {}

  ngOnInit() { 
    this.currentDate$ = this.store.pipe(select(selectRouteDate));
    this.list$ = this.store.pipe(select(selectCurrentProductions));
    this.loading$ = this.productionsEntityService.loading$;
    
    this.blocksEntityService.load();
    this.productionsEntityService.load();
  }

  onSelectUProductionId(production: Production): void {
    if(production.Type === 'Edit'){
      this.router.navigate(["productions/edit", production.UProductionId]);
      return;
    } 
    if(production.Type === 'Add'){
      this.router.navigate(["productions/add", production.UProductionId]);
      return;
    }
    production.Type = 'Add';
    this.productionsEntityService.addOneToCache(production);
    this.router.navigate(["productions/add", production.UProductionId]);
  }

  onDateChanged(date: Date): void {
    this.router.navigate(["productions", formatDate(date, 'yyyy-MM-dd', 'en-US')]);
  }
}


