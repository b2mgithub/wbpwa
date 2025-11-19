import { EntitySelectorsFactory } from "@ngrx/data";
import { createSelector } from '@ngrx/store';
import { Dictionary } from '@ngrx/entity';

import { Production } from './productions.model';
import { selectRouteDate, selectRouteID } from '@b2m/router';
import { selectUserDivision } from '@app/users/store/users.selectors';
import { Block } from '@app/blocks/store/blocks.model';
import { Guid } from 'guid-typescript';
import { dateFromISOString, isInDateRange, isSameDay, toShortISOString, isBefore } from '@b2m/date';

const productionsSelector = new EntitySelectorsFactory().create<Production>('Production');
const blocksSelector = new EntitySelectorsFactory().create<Block>('Block');

export const selectCurrentProduction = createSelector(
  productionsSelector.selectEntityMap,
  selectRouteID,
  (productionMap: Dictionary<Production>, UProductionId: string) => {
    if(productionMap && UProductionId){
      const currentProduction = {
        ...productionMap[UProductionId], 
        Harvesting: {...productionMap[UProductionId].Harvesting},
        Graveling: {...productionMap[UProductionId].Graveling},
        RoadConstruction: {...productionMap[UProductionId].RoadConstruction}
      }
      Object.keys(currentProduction.Harvesting).forEach(key => {
        if(currentProduction.Harvesting[key] === 0) { currentProduction.Harvesting[key] = null }
      })
      Object.keys(currentProduction.Graveling).forEach(key => {
        if(currentProduction.Graveling[key] === 0) { currentProduction.Graveling[key] = null }
      })
      Object.keys(currentProduction.RoadConstruction).forEach(key => {
        if(currentProduction.RoadConstruction[key] === 0) { currentProduction.RoadConstruction[key] = null }
      })
      return currentProduction;
    }
    return undefined;
  }
)

export const selectCurrentProductions = createSelector(
  selectRouteDate,
  selectUserDivision,
  blocksSelector.selectEntities,
  productionsSelector.selectEntities,
  (date: Date, division: string, blocks: Block[], productions: Production[]) => {
    if(date){
      return blocks.filter(block => block.Division === division || division === 'All')
      .filter(block => isInDateRange(date, dateFromISOString(block.StartDate), dateFromISOString(block.EndDate)))
      .map(block => { 
        let currentProduction = productions.find(production => production.UBlockId === block.UBlockId && isSameDay(date, dateFromISOString(production.Date)));
        if(currentProduction){
          return currentProduction
        } 
        currentProduction = { 
          ...new Production(),
          UProductionId: Guid.create().toString(),
          Block: block.Block,
          UBlockId: block.UBlockId,
          Description: block.Description,
          Division: block.Division,
          StartDate: block.StartDate,
          EndDate: block.EndDate,
          Date: toShortISOString(date),
          Type: null,
          Harvesting: {
            HBunchingH: null,
            HBunchingP: null,
            HSkiddingH: null,
            HSkiddingP: null,
            HDeckingH: null,
            HDeckingP: null,
            HProcessingH: null,
            HProcessingP: null,
            HLoadingH: null,
            HLoadingP: null,
          },
          RoadConstruction: {
            RCat1: null,
            RCat1Type: null,
            RCat2: null,
            RCat2Type: null,
            RGrader: null,
            RHoe1: null,
            RHoe1Type: null,
            RHoe2: null,
            RHoe2Type: null,
            RLabour: null,
            RPacker: null,
            RPercent: null,
            RRockTruck: null,
          },
          Graveling: {
            GCat1: null,
            GCat1Type: null,
            GCat2: null,
            GCat2Type: null,
            GGrader: null,
            GHoe1: null,
            GHoe1Type: null,
            GHoe2: null,
            GHoe2Type: null,
            GLabour: null,
            GPacker: null,
            GPercent: null,
            GRockTruck: null,
          },
        }
        return currentProduction;
      })
      .sort((a, b) => a.Block.localeCompare(b.Block))
    }
    return [];
  }
)
export const selectPastProductions = createSelector(
  selectCurrentProduction,
  productionsSelector.selectEntities,
  (currentProduction: Production, entities: Production[]) => {
    if(currentProduction && entities){
      return entities.filter(entity => {
        return (entity.UBlockId === currentProduction.UBlockId) && 
          isBefore(dateFromISOString(entity.Date), dateFromISOString(currentProduction.Date));
      })
    }
    return [];
  }
);

export const selectLastPercentage = createSelector(
  selectPastProductions,
  (productions: Production[]) => productions.sort((a, b) => {
    const dateA = new Date(a.Date);
    const dateB = new Date(b.Date);
    return dateA.getTime() - dateB.getTime();
  })
  .reduce((aggregates, production) => {
    return aggregates = {
      Bunching: production.Harvesting.HBunchingP ? production.Harvesting.HBunchingP : aggregates.Bunching,
      Skidding: production.Harvesting.HSkiddingP ? production.Harvesting.HSkiddingP : aggregates.Skidding,
      Decking: production.Harvesting.HDeckingP ? production.Harvesting.HDeckingP : aggregates.Decking,
      Processing:  production.Harvesting.HProcessingP ? production.Harvesting.HProcessingP : aggregates.Processing,
      Loading: production.Harvesting.HLoadingP ? production.Harvesting.HLoadingP : aggregates.Loading,
      RPercent: production.Graveling.GPercent ? production.Graveling.GPercent : aggregates.GPercent,
      GPercent: production.RoadConstruction.RPercent ? production.RoadConstruction.RPercent : aggregates.RPercent
    }    
  }, {
    Bunching: 0,
    Skidding: 0,
    Decking: 0,
    Processing: 0,
    Loading: 0,
    RPercent: 0,
    GPercent:0
  })
);
