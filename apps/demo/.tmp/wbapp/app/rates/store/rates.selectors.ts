import { EntitySelectorsFactory } from '@ngrx/data';
import { createSelector } from '@ngrx/store';
import { State as GridSate, process } from '@progress/kendo-data-query'
import { GridDataResult } from '@progress/kendo-angular-grid';
import { selectRouteGridState } from '@b2m/router';
import { Rate } from './rate.model';


const ratesSelector = new EntitySelectorsFactory().create<Rate>('Rate');

export const  selectGridRates = createSelector(
  ratesSelector.selectEntities,
  selectRouteGridState(),
  (rates: Rate[], gridState: GridSate): GridDataResult => {
    return process(rates, gridState);
  }
)

export const selectPricing = createSelector(
  ratesSelector.selectEntities,
  (rates: Rate[]) => rates.reduce((map, rate) => {
    map[rate.Type] = rate.Rate;
    return map
  }, {})
)