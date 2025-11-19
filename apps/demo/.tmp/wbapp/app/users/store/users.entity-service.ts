import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { User } from './users.model';

@Injectable({ providedIn: 'root' })
export class UsersEntityService extends EntityCollectionServiceBase<User> {
  constructor(factory: EntityCollectionServiceElementsFactory) {
    super('User', factory);
  }
}
