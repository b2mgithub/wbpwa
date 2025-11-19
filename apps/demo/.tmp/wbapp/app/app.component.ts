import { Component, OnInit } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { select, Store } from '@ngrx/store';
import { createSignalRHub } from 'ngrx-signalr-core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthUser, selectAuthenticatedUser } from '@b2m/auth';
import { wbHub } from './hubs';


@Component({ 
  selector: 'wbapp-root', 
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'] 
})

export class AppComponent implements OnInit {
  user$: Observable<AuthUser>;
  isHandset$: Observable<boolean>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private store: Store
  ) {}
                
  ngOnInit() {
    this.user$ = this.store.pipe(select(selectAuthenticatedUser))
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches)
    );

    this.store.dispatch(
      createSignalRHub(wbHub)
    );
  }

}
    