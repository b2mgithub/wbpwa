import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { IdbCreate, IdbEffectsInit, IdbRemove } from '@b2m/ngrx-data-idb';
import { loginSuccess, restoreUserSuccess, logout, refreshToken, refreshTokenSuccess }from '@b2m/auth'


@Injectable()
export class AppEffects{

  idbCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess, restoreUserSuccess, refreshTokenSuccess),
      map(({user}) => IdbCreate({ userId: user.UserId }))
    )
  );

  restore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IdbEffectsInit),
      map(_ => refreshToken())
    )
  );
  idbRemove$ = createEffect(() => this.actions$.pipe(
    ofType(logout),
    map(() => IdbRemove())
  ));

  constructor(
    private actions$: Actions,
  ) {}
}