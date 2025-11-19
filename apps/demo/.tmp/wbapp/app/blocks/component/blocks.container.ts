import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { State as GridState, toDataSourceRequest, } from '@progress/kendo-data-query';
import { GridDataResult, DataStateChangeEvent, RemoveEvent } from '@progress/kendo-angular-grid';
import { Observable, of } from 'rxjs';
import { Guid } from 'guid-typescript';

import { Block } from '../store/blocks.model';

import { selectRouteGridState } from '@b2m/router';
import { selectGridBlocks, selectEditItem } from '../store/blocks.selectors';
import { BlocksEntityService } from '../store/blocks.entity-service';
import { ProductionsEntityService } from '../../productions/store/productions.entity-service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'wbapp-blocks-container',
  template: `
    <mat-progress-bar *ngIf="loading$ | async" mode="indeterminate"></mat-progress-bar>
    <wbapp-blocks-component
      [data]="data$ | async"
      [gridState] ="gridState$ | async"
      (add)="addHandler()"
      (edit)="editHandler($event)"
      (remove)="removeHandler($event)"
      (dataStateChange)="gridStateChange($event)"
    ></wbapp-blocks-component>
    <productions-blocks-edit-container>
    </productions-blocks-edit-container>
    <b2m-confirm-component [active]="removeDataItem" (confirm)="confirmHandler($event)">
      <p>Are you sure you want to remove the block{{removeDataItem?.Block ? ': "'+removeDataItem.Block+'"' : ''}}?</p>
    </b2m-confirm-component>
  `
})

export class BlocksContainer implements OnInit {
  public data$: Observable<GridDataResult>;
  public gridState$: Observable<GridState>;
  public editDataItem$: Observable<Block>;
  public removeDataItem: Block;
  public isNew: boolean;
  public loading$: Observable<boolean>;

  constructor(
    private store: Store<any>,
    private router: Router,
    private blocksEntityService: BlocksEntityService,
    private productionsEntityService: ProductionsEntityService,
  ) {}

  public ngOnInit(): void {
    this.data$ = this.store.pipe(select(selectGridBlocks));
    this.gridState$ = this.store.pipe(select(selectRouteGridState()));
    this.loading$ = this.blocksEntityService.loading$;
  
    this.blocksEntityService.load();
    this.productionsEntityService.load();

  }

  public gridStateChange(state: DataStateChangeEvent): void {
    this.router.navigate([], {queryParams: toDataSourceRequest(state)});
  }

  // public addHandler() {
  //   this.editDataItem = new Block();
  //   this.editDataItem.UBlockId = Guid.create().toString();
  //   this.isNew = true;
  // }

  
  public addHandler() {
    this.router.navigate(['blocks/add/']);
  }

  // public editHandler({ dataItem }) {
  //   const fixedDates = { ...dataItem, "StartDate": dateFromISOString(dataItem['StartDate']), "EndDate": dateFromISOString(dataItem['EndDate']) };
  //   console.log('blocks fixedDates after', JSON.stringify(fixedDates));
  //   this.editDataItem = fixedDates;
  //   this.isNew = false;
  // }

  
  public editHandler({ dataItem }) {
    this.router.navigate(['blocks','edit', dataItem.UBlockId]);
  }


  public removeHandler({dataItem}) {
    this.removeDataItem = dataItem;
  }

  public confirmHandler(confirm: boolean): void {
    if(confirm){
      console.log('Block dispatched to delete(Block) Service', this.removeDataItem);
      this.blocksEntityService.delete(this.removeDataItem);
    }
    this.removeDataItem = undefined;
  }
}

