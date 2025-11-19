import { refreshTokenSuccess, restoreUserError, restoreUserSuccess } from '@b2m/auth';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { appInitializerComplete, appInitializerStart } from './store/app.actions';

export function initApplication(store: Store, actions$: Actions): Function {
  return () => new Promise(resolve => {
        store.dispatch(appInitializerStart());
        actions$.pipe(
         ofType(restoreUserSuccess, restoreUserError, refreshTokenSuccess,),
         take(1),
        ).subscribe(_ => {
          store.dispatch(appInitializerComplete());
          resolve(true) 
        });
      })
}