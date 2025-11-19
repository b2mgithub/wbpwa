import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { Store, select } from '@ngrx/store';
import { Observable } from "rxjs";

import { Production } from "../store/productions.model";
import { selectLastPercentage, selectCurrentProduction } from '../store/productions.selectors';
import { ProductionsEntityService } from '../store/productions.entity-service';
import { AuthService, selectAuthenticatedUserId } from '@b2m/auth';

@Component({
  selector: "productions-edit-container",
  template: `
    <div class="container">
      <wbapp-edit-component
        [selectedProduction]="selectedProduction$ | async"
        [placeHolders]="placeHolders$ | async"
        [userId]="userId$ | async"
        (handleSubmit)="submit($event)"
        (handleBack)="back()"
      ></wbapp-edit-component>
    </div>
`
})

export class EditContainer implements OnInit {
  selectedProduction$: Observable<Production>;
  placeHolders$: Observable<any>
  userId$: Observable<string | number>;

  constructor(
    private productionsEntityService: ProductionsEntityService,
    private location: Location,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.selectedProduction$ = this.store.pipe(select(selectCurrentProduction));
    this.placeHolders$ = this.store.pipe(select(selectLastPercentage));       
    this.userId$ = this.store.pipe(select(selectAuthenticatedUserId));
  }

  submit(production: Production): void {

    if(production.Type === 'Add'){
      production.Type = 'Edit';
    }
    console.log('edited production', production);
    this.productionsEntityService.update(production);
    this.location.back();
  }

  back(): void {
    this.location.back();
  }
}
