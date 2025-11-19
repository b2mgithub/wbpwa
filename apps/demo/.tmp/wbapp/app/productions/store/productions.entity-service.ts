import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { Production } from './productions.model';

@Injectable({ providedIn: 'root' })
export class ProductionsEntityService extends EntityCollectionServiceBase<Production> {
  constructor(factory: EntityCollectionServiceElementsFactory) {
    super('Production', factory);
  }
}
