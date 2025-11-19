import { EntitySelectorsFactory } from '@ngrx/data';
import { createSelector } from '@ngrx/store';
import { State as GridSate, process } from '@progress/kendo-data-query'
import { GridDataResult } from '@progress/kendo-angular-grid';
import { selectRouteGridState, selectRouteParams } from '@b2m/router';
import { Block } from "./blocks.model";
import { Dictionary } from '@ngrx/entity';
import { dateFromISOString, isBefore, isSameDayOrAfter, today } from '@b2m/date';


const blocksSelector = new EntitySelectorsFactory().create<Block>('Block');

export const selectRouteActive = createSelector(
  selectRouteParams,
  (routeParams) => routeParams.active
)

export const  selectGridBlocks = createSelector(
  blocksSelector.selectEntities,
  selectRouteGridState(),
  selectRouteActive,
  (blocks: Block[], gridState: GridSate, active: string): GridDataResult => {
    blocks = blocks.filter(block => active === 'active' ? 
      isSameDayOrAfter(dateFromISOString(block.EndDate), today()) : 
      isBefore(dateFromISOString(block.EndDate), today()));
    return process(blocks, gridState);
  }
)

export const selectRouteId = createSelector(
  selectRouteParams,
  (routeParams) => routeParams.id
)
export const selectEditItem = createSelector(
  selectRouteId,
  blocksSelector.selectEntityMap,
  (id: string, map: Dictionary<Block>) => {
    if(id && map) {
      return map[id];
    }
    return undefined;
  }
)