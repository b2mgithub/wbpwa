import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { Rate } from './rate.model';

@Injectable({ providedIn: 'root' })
export class RatesEntityService extends EntityCollectionServiceBase<Rate> {
  constructor(factory: EntityCollectionServiceElementsFactory) {
    super('Rate', factory);
  }
}
