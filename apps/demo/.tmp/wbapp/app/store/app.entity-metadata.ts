import { DefaultDataServiceConfig } from '@ngrx/data';
import { IdbEntityDataModuleConfig, IdbEntityMetadataMap } from '@b2m/ngrx-data-idb'

import { environment } from '../../environments/environment';
import { Block } from "../blocks/store/blocks.model";
import { Production } from '../productions/store/productions.model';
import { User } from '../users/store/users.model';
import { Rate } from '@app/rates/store/rate.model';
import { pluralNames } from './plural-names';

const sortBlocksByDivBlock = ( a: { Division: string, Block: string}, b: { Division: string, Block: string}): number => {
  return (a.Division || '').localeCompare((b.Division || '')) !== 0 ? (a.Division || '').localeCompare((b.Division || '')) :
    (a.Block || '').localeCompare((b.Block || ''));
}

const entityMetadata: IdbEntityMetadataMap = {
  Block: {
    selectId: (block: Block) => block.UBlockId,
    sortComparer: sortBlocksByDivBlock,
    noChangeTracking: true,
    offlinePersist: true,
    entityIdField: 'UBlockId'
  },
  Production: {
    selectId: (production: Production) => production.UProductionId,
    noChangeTracking: true,
    offlinePersist: true,
    entityIdField: 'UProductionId'
  },
  User: {
    selectId: (user: User) => user.UserId,
    noChangeTracking: true,
    offlinePersist: true,
    entityIdField: 'UserId'
  },
  Rate: {
    selectId: (rate: Rate) => rate.URateId,
    noChangeTracking: true,
    offlinePersist: true,
    entityIdField: 'URateId'
  }
}

export const idbEntityConfig: IdbEntityDataModuleConfig = {
  entityMetadata,
  pluralNames
}
export const defaultDataServiceConfig: DefaultDataServiceConfig = {
  root: environment.wbappCore,
}