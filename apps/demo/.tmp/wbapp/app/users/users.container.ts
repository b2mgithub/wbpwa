import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GridDataResult, DataStateChangeEvent} from '@progress/kendo-angular-grid';
import { State as GridState, toDataSourceRequest } from '@progress/kendo-data-query';
import { User } from './store/users.model';
import { Store, select } from '@ngrx/store';
import { Router } from '@angular/router';
import { UsersEntityService } from './store/users.entity-service';
import { selectRouteGridState } from '@b2m/router';
import { selectGridUsers } from './store/users.selectors';
import { AuthService } from '@b2m/auth';
import { Guid } from 'guid-typescript';

@Component({
  selector: 'wbapp-users-container',
  template: `
    <mat-progress-bar *ngIf="loading$ | async" mode="indeterminate"></mat-progress-bar>
    <users-component
      [data]="data$ | async"
      [gridState] ="gridState$ | async"
      (add)="addHandler()"
      (edit)="editHandler($event)"
      (remove)="removeHandler($event)"
      (dataStateChange)="gridStateChange($event)"
    ></users-component>
    <wbapp-users-edit [model]="editDataItem" [isNew]="isNew"
        (save)="saveHandler($event)"
        (cancel)="cancelHandler()">
    </wbapp-users-edit>
  `
})

export class UsersContainer implements OnInit {
  public data$: Observable<GridDataResult>;
  public gridState$: Observable<GridState>;
  public editDataItem: User;
  public isNew: boolean;
  public loading$: Observable<boolean>;

  constructor(
    private store: Store,
    private router: Router,
    private usersEntityService: UsersEntityService,
    private authService: AuthService,
  ) {}

  public ngOnInit(): void {    
    this.data$ = this.store.pipe(select(selectGridUsers));
    this.gridState$ = this.store.pipe(select(selectRouteGridState()));
    this.loading$ = this.usersEntityService.loading$;
  
    this.usersEntityService.load();
  }

  public gridStateChange(state: DataStateChangeEvent): void {
    this.router.navigate(['users'], {queryParams: toDataSourceRequest(state)});
  }

  public addHandler() {
    this.editDataItem = new User();
    this.editDataItem.UserId = Guid.create().toString();
    this.isNew = true;
  }

  public editHandler({ dataItem }) {
    this.editDataItem = dataItem;
    this.isNew = false;
  }

  public cancelHandler() {
    this.editDataItem = undefined;
  }

  public saveHandler(user: User) {
    if(this.isNew){
      console.log('User dispatched to register(User) Service', user);
      this.authService.register(user);
    }
    else{
      console.log('User dispatched to update(User) Service', user);
      this.usersEntityService.update(user);
    }
    this.editDataItem = undefined;
  }

  public removeHandler({dataItem}) {
    console.log('User dispatched to delete(User) Service', dataItem);
    this.usersEntityService.delete(dataItem);
  }
}

