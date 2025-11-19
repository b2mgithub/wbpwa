import { Injectable } from '@angular/core';
import {
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory
} from '@ngrx/data';
import { Block } from './blocks.model';

@Injectable({ providedIn: 'root' })
export class BlocksEntityService extends EntityCollectionServiceBase<Block> {
  constructor(factory: EntityCollectionServiceElementsFactory) {
    super('Block', factory);
  }
}
