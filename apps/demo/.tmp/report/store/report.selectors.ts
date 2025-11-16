import { EntitySelectorsFactory } from "@ngrx/data";
import { createSelector } from '@ngrx/store';

import { Block } from '../../blocks/store/blocks.model';
import { Production } from '../../productions/store/productions.model';
import { harvestingMetrics } from './report.model';
import { selectRouteDate } from '@b2m/router';
import { selectPricing } from '@app/rates/store/rates.selectors';
import { selectUserDivision } from '@app/users/store/users.selectors';
import { isInDateRange, dateFromISOString, isSameDayOrBefore } from '@b2m/date';

const aggregatesZeroValues = {
  Harvesting: {
    BunchingH: 0,
    BunchingP: 0,
    SkiddingH: 0,
    SkiddingP: 0,
    DeckingH: 0,
    DeckingP: 0,
    ProcessingH: 0,
    ProcessingP: 0,
    LoadingH: 0,
    LoadingP: 0,
  },
  Graveling:{
    AccumulatedCost: 0,
    GPercent: 0
  },
  RoadConstruction:{
    AccumulatedCost: 0,
    RPercent: 0
  }
};

const productionsSelector = new EntitySelectorsFactory().create<Production>('Production');
const blocksSelector = new EntitySelectorsFactory().create<Block>('Block');


export const selectReportBlocks = createSelector(
  selectRouteDate,
  selectUserDivision,
  blocksSelector.selectEntities,
  (date: Date, division: string, blocks: Block[]) => {
    if(date && blocks){
      const filteredBlocks = blocks.filter(block => {
        return (block.Division === division || division === 'All') &&
          isInDateRange(date, dateFromISOString(block.StartDate), dateFromISOString(block.EndDate));
      });
      return filteredBlocks;
    }
    return undefined;
  }
)

export const selectReportProductions = createSelector(
  selectRouteDate,
  selectReportBlocks,
  productionsSelector.selectEntities,
  (date: Date, blocks: Block[], productions: Production[]) => {
    if(date && blocks && productions){ 
      return productions.filter(production =>  {
        return blocks.find(block => block.UBlockId === production.UBlockId) &&
        isSameDayOrBefore(dateFromISOString(production.Date), date);
      });
    }
    return undefined;
  } 
)

export const selectReport = createSelector(
  selectRouteDate,
  selectPricing,
  selectReportBlocks,
  selectReportProductions,
  (date: Date, pricing: any, blocks: Block[], productions: Production[]) => { 
    if(date && blocks && productions){
      const divisions = blocks.reduce((divs, block) => {
        if(!divs.includes(block.Division)){
          divs.push(block.Division);
        }
        return divs;
      }, []).sort();
      return divisions.map(division => {
        return {Division: division, Blocks: blocks.filter(block => block.Division === division)
          .map(block => blockAggregateReport(block, productions, date, pricing))
          .sort(blockSort)}
      });
    }
    return undefined;
  }
)

function blockAggregateReport(block: Block, productions: Production[], date: Date, pricing: any){
  const blockAggregates = productions.filter(production => (production.UBlockId === block.UBlockId))
  .sort(sortByDate)
  .reduce((aggregates, production) => {
   return{
     Harvesting: {
       BunchingH: aggregates.Harvesting.BunchingH + production.Harvesting.HBunchingH,
       BunchingP: production.Harvesting.HBunchingP ? production.Harvesting.HBunchingP : aggregates.Harvesting.BunchingP,
       SkiddingH: aggregates.Harvesting.SkiddingH +production.Harvesting.HSkiddingH,
       SkiddingP: production.Harvesting.HSkiddingP ? production.Harvesting.HSkiddingP : aggregates.Harvesting.SkiddingP,
       DeckingH: aggregates.Harvesting.DeckingH + production.Harvesting.HDeckingH,
       DeckingP: production.Harvesting.HDeckingP ? production.Harvesting.HDeckingP : aggregates.Harvesting.DeckingP,
       ProcessingH: aggregates.Harvesting.ProcessingH + production.Harvesting.HProcessingH,
       ProcessingP: production.Harvesting.HProcessingP ? production.Harvesting.HProcessingP : aggregates.Harvesting.ProcessingP,
       LoadingH: aggregates.Harvesting.LoadingH + production.Harvesting.HLoadingH,
       LoadingP: production.Harvesting.HLoadingP ? production.Harvesting.HLoadingP : aggregates.Harvesting.LoadingP,
     },
     Graveling: {
       AccumulatedCost: aggregates.Graveling.AccumulatedCost 
         + (pricing[production.Graveling.GCat1Type] || 0)*production.Graveling.GCat1
         + (pricing[production.Graveling.GCat2Type] || 0)*production.Graveling.GCat2
         + (pricing[production.Graveling.GHoe1Type] || 0)*production.Graveling.GHoe1
         + (pricing[production.Graveling.GHoe2Type] || 0)*production.Graveling.GHoe2
         + (pricing['RockTruck'] || 0)*production.Graveling.GRockTruck
         + (pricing['Grader'] || 0)*production.Graveling.GGrader
         + (pricing['Packer'] || 0)*production.Graveling.GPacker
         + (pricing['Labour'] || 0)*production.Graveling.GLabour,
       GPercent: production.Graveling.GPercent ? production.Graveling.GPercent : aggregates.Graveling.GPercent
     },
     RoadConstruction: {
       AccumulatedCost: aggregates.RoadConstruction.AccumulatedCost 
         + (pricing[production.RoadConstruction.RCat1Type] || 0)*production.RoadConstruction.RCat1
         + (pricing[production.RoadConstruction.RCat2Type] || 0)*production.RoadConstruction.RCat2
         + (pricing[production.RoadConstruction.RHoe1Type] || 0)*production.RoadConstruction.RHoe1
         + (pricing[production.RoadConstruction.RHoe2Type] || 0)*production.RoadConstruction.RHoe2
         + (pricing['RockTruck'] || 0)*production.RoadConstruction.RRockTruck
         + (pricing['Grader'] || 0)*production.RoadConstruction.RGrader
         + (pricing['Packer'] || 0)*production.RoadConstruction.RPacker
         + (pricing['Labour'] || 0)*production.RoadConstruction.RLabour,
       RPercent: production.RoadConstruction.RPercent ? production.RoadConstruction.RPercent : aggregates.RoadConstruction.RPercent
     }
   }
  }, aggregatesZeroValues );
  return {
    Block: block.Block, 
    Harvesting: harvestingMetrics.map(metric => {return {
      Metric: metric,
      HPlan: block[metric],
      HSum: blockAggregates.Harvesting[`${metric}H`],
      HP: (blockAggregates.Harvesting[`${metric}H`]/block[metric]),
      PMax: blockAggregates.Harvesting[`${metric}P`]/100,
      HVol: block.BlockVolume*blockAggregates.Harvesting[`${metric}P`]/100/blockAggregates.Harvesting[`${metric}H`],
      HVar: (block[metric] * (blockAggregates.Harvesting[`${metric}P`] - 
        (blockAggregates.Harvesting[`${metric}H`]/block[metric]*100))/100),
      PVar: (blockAggregates.Harvesting[`${metric}P`]/100 - blockAggregates.Harvesting[`${metric}H`]/block[metric]),
    }}), 
    Graveling:  {
      Km: block.GravelingKm,
      Plan: block.Graveling,
      AccumulatedCost: blockAggregates.Graveling.AccumulatedCost,
      CompleteP: blockAggregates.Graveling.GPercent/100,
      CostPerKm: (blockAggregates.Graveling.AccumulatedCost /
        (block.GravelingKm * blockAggregates.Graveling.GPercent / 100)),
      TargetPerKm: (block.Graveling / block.GravelingKm),
      Var: ((blockAggregates.Graveling.AccumulatedCost / (block.GravelingKm * 
        blockAggregates.Graveling.GPercent / 100) - (block.Graveling/ block.GravelingKm))),
      PVar: ((blockAggregates.Graveling.AccumulatedCost / (block.GravelingKm * 
        blockAggregates.Graveling.GPercent / 100) - (block.Graveling/ block.GravelingKm)) /
        (block.Graveling / block.GravelingKm))
    },
    RoadConstruction: {
      Km: block.RoadConstructionKm,
      Plan: block.RoadConstruction,
      AccumulatedCost: blockAggregates.RoadConstruction.AccumulatedCost,
      CompleteP: blockAggregates.RoadConstruction.RPercent/100,
      CostPerKm: (blockAggregates.RoadConstruction.AccumulatedCost /
        (block.RoadConstructionKm * blockAggregates.RoadConstruction.RPercent / 100)),
      TargetPerKm: (block.RoadConstruction / block.RoadConstructionKm),
      Var: ((blockAggregates.RoadConstruction.AccumulatedCost / (block.RoadConstructionKm * 
        blockAggregates.RoadConstruction.RPercent / 100) - (block.RoadConstruction/ block.RoadConstructionKm))),
      PVar: ((blockAggregates.RoadConstruction.AccumulatedCost / (block.RoadConstructionKm * 
        blockAggregates.RoadConstruction.RPercent / 100) - (block.RoadConstruction/ block.RoadConstructionKm)) /
        (block.RoadConstruction / block.RoadConstructionKm))
    }
  }
} 

function blockSort(a, b) {
  return a.Block < b.Block ? -1 : (a.block > b.block ? 1 : 0)
}

const sortByDate = (a, b) => {
  const dateA = new Date(a.Date);
  const dateB = new Date(b.Date);
  return dateA.getTime() - dateB.getTime();
}