import { EntitySelectorsFactory } from '@ngrx/data';
import { createSelector } from '@ngrx/store';
import { State as GridSate, process } from '@progress/kendo-data-query'
import { GridDataResult } from '@progress/kendo-angular-grid';
import { selectRouteGridState } from '@b2m/router';
import { User } from './users.model';
import { selectAuthenticatedUser } from '@b2m/auth';


const usersSelector = new EntitySelectorsFactory().create<User>('User');

export const  selectGridUsers = createSelector(
  usersSelector.selectEntities,
  selectRouteGridState(),
  (users: User[], gridState: GridSate): GridDataResult => {
    return process(users, gridState);
  }
)

export const selectUserDivision = createSelector(
  selectAuthenticatedUser,
  (user: User) => user.Division
)