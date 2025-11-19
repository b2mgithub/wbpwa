import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Report, BlockReport, harvestingMetrics } from './report.model';
import { ReportComponent } from './report.component';
import { ProductionsStore } from '../productions/productions.state';
import { Production } from '../productions/productions.model';
import { Block } from '../blocks/blocks.model';
import { BlocksStore } from '../blocks/blocks.state';
import { RatesStore } from '../rates/rates.state';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ReportComponent],
  templateUrl: './reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private productionsStore = inject(ProductionsStore);
  private blocksStore = inject(BlocksStore);
  private ratesStore = inject(RatesStore);
  productions = this.productionsStore.productions;
  blocks = this.blocksStore.entities;
  userDivision = signal<string>('All');
  routeDate = signal<Date>(new Date());

  // Compute pricing from rates: { Type: Rate }
  // Maps equipment types (D7, 320, RockTruck, etc.) to their rates
  pricing = computed(() => {
    const rates = this.ratesStore.entities();
    return rates.reduce((acc, rate) => {
      acc[rate.Type] = rate.Rate;
      return acc;
    }, {} as Record<string, number>);
  });

  reportBlocks = computed(() => {
    const date = this.routeDate();
    const division = this.userDivision();
    return this.blocks().filter(block =>
      (block.Division === division || division === 'All') &&
      isInDateRange(date, new Date(block.StartDate), new Date(block.EndDate))
    );
  });

  reportProductions = computed(() => {
    const date = this.routeDate();
    const blocks = this.reportBlocks();
    return this.productions().filter(prod =>
      blocks.find(block => block.BlockId === prod.BlockId) &&
      isSameDayOrBefore(new Date(prod.Date), date)
    );
  });

  report = computed<Report[]>(() => {
    const date = this.routeDate();
    const pricing = this.pricing();
    const blocks = this.reportBlocks();
    const productions = this.reportProductions();
    if (!date || !blocks.length || !productions.length) return [];
    const divisions = [...new Set(blocks.map(b => b.Division))].sort();
    return divisions.map(division => ({
      Division: division,
      Blocks: blocks
        .filter(b => b.Division === division)
        .map(block => blockAggregateReport(block, productions, date, pricing))
        .sort((a, b) => a.Block.localeCompare(b.Block))
    }));
  });

  // Variance color helpers (replacing old pipes with modern approach)
  getVarianceHighlightColor(variance: number): string {
    return Math.abs(variance) > 0 ? (variance > 0 ? 'green' : 'red') : 'black';
  }

  getVarianceLowlightColor(variance: number): string {
    return Math.abs(variance) > 0 ? (variance > 0 ? 'red' : 'green') : 'black';
  }
}

function isInDateRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

function isSameDayOrBefore(a: Date, b: Date) {
  return a.getTime() <= b.getTime();
}

function blockAggregateReport(block: any, productions: any[], date: Date, pricing: any): BlockReport {
  const aggregatesZeroValues = {
    Harvesting: {
      BunchingH: 0, BunchingP: 0, SkiddingH: 0, SkiddingP: 0, DeckingH: 0, DeckingP: 0, ProcessingH: 0, ProcessingP: 0, LoadingH: 0, LoadingP: 0,
    },
    Graveling: { AccumulatedCost: 0, GPercent: 0 },
    RoadConstruction: { AccumulatedCost: 0, RPercent: 0 },
  };
  const blockAggregates = productions.filter(production => (production.BlockId === block.BlockId))
    .sort(sortByDate)
    .reduce((aggregates, production) => {
      return {
        Harvesting: {
          BunchingH: aggregates.Harvesting.BunchingH + (production.HBunchingH || 0),
          BunchingP: production.HBunchingP ? production.HBunchingP : aggregates.Harvesting.BunchingP,
          SkiddingH: aggregates.Harvesting.SkiddingH + (production.HSkiddingH || 0),
          SkiddingP: production.HSkiddingP ? production.HSkiddingP : aggregates.Harvesting.SkiddingP,
          DeckingH: aggregates.Harvesting.DeckingH + (production.HDeckingH || 0),
          DeckingP: production.HDeckingP ? production.HDeckingP : aggregates.Harvesting.DeckingP,
          ProcessingH: aggregates.Harvesting.ProcessingH + (production.HProcessingH || 0),
          ProcessingP: production.HProcessingP ? production.HProcessingP : aggregates.Harvesting.ProcessingP,
          LoadingH: aggregates.Harvesting.LoadingH + (production.HLoadingH || 0),
          LoadingP: production.HLoadingP ? production.HLoadingP : aggregates.Harvesting.LoadingP,
        },
        Graveling: {
          AccumulatedCost: aggregates.Graveling.AccumulatedCost
            + (pricing[production.GCat1Type] || 0) * (production.GCat1 || 0)
            + (pricing[production.GCat2Type] || 0) * (production.GCat2 || 0)
            + (pricing[production.GHoe1Type] || 0) * (production.GHoe1 || 0)
            + (pricing[production.GHoe2Type] || 0) * (production.GHoe2 || 0)
            + (pricing['RockTruck'] || 0) * (production.GRockTruck || 0)
            + (pricing['Grader'] || 0) * (production.GGrader || 0)
            + (pricing['Packer'] || 0) * (production.GPacker || 0)
            + (pricing['Labour'] || 0) * (production.GLabour || 0),
          GPercent: production.GPercent ? production.GPercent : aggregates.Graveling.GPercent
        },
        RoadConstruction: {
          AccumulatedCost: aggregates.RoadConstruction.AccumulatedCost
            + (pricing[production.RCat1Type] || 0) * (production.RCat1 || 0)
            + (pricing[production.RCat2Type] || 0) * (production.RCat2 || 0)
            + (pricing[production.RHoe1Type] || 0) * (production.RHoe1 || 0)
            + (pricing[production.RHoe2Type] || 0) * (production.RHoe2 || 0)
            + (pricing['RockTruck'] || 0) * (production.RRockTruck || 0)
            + (pricing['Grader'] || 0) * (production.RGrader || 0)
            + (pricing['Packer'] || 0) * (production.RPacker || 0)
            + (pricing['Labour'] || 0) * (production.RLabour || 0),
          RPercent: production.RPercent ? production.RPercent : aggregates.RoadConstruction.RPercent
        }
      };
    }, aggregatesZeroValues);
  return {
    Block: block.Block,
    Harvesting: harvestingMetrics.map(metric => {
      const HPlan = block[metric] || 0;
      const HSum = blockAggregates.Harvesting[`${metric}H`] || 0;
      const HP = HPlan ? HSum / HPlan : 0;
      const PMax = (blockAggregates.Harvesting[`${metric}P`] || 0) / 100;
      const HVol = (block.BlockVolume && blockAggregates.Harvesting[`${metric}P`] && blockAggregates.Harvesting[`${metric}H`])
        ? block.BlockVolume * blockAggregates.Harvesting[`${metric}P`] / 100 / blockAggregates.Harvesting[`${metric}H`]
        : 0;
      const HVar = HPlan ? (HPlan * (blockAggregates.Harvesting[`${metric}P`] - (HSum / HPlan * 100)) / 100) : 0;
      const PVar = HPlan ? ((blockAggregates.Harvesting[`${metric}P`] / 100) - (HSum / HPlan)) : 0;
      return {
        Metric: metric,
        HPlan,
        HSum,
        HP,
        PMax,
        HVol,
        HVar,
        PVar
      };
    }),
    Graveling: {
      Km: block.GravelingKm,
      Plan: block.Graveling,
      AccumulatedCost: blockAggregates.Graveling.AccumulatedCost,
      CompleteP: (blockAggregates.Graveling.GPercent || 0) / 100,
      CostPerKm: (blockAggregates.Graveling.AccumulatedCost && block.GravelingKm && blockAggregates.Graveling.GPercent)
        ? blockAggregates.Graveling.AccumulatedCost / (block.GravelingKm * blockAggregates.Graveling.GPercent / 100)
        : 0,
      TargetPerKm: (block.Graveling && block.GravelingKm) ? block.Graveling / block.GravelingKm : 0,
      Var: (blockAggregates.Graveling.AccumulatedCost && block.Graveling && block.GravelingKm && blockAggregates.Graveling.GPercent)
        ? (blockAggregates.Graveling.AccumulatedCost / (block.GravelingKm * blockAggregates.Graveling.GPercent / 100) - (block.Graveling / block.GravelingKm))
        : 0,
      PVar: (blockAggregates.Graveling.AccumulatedCost && block.Graveling && block.GravelingKm && blockAggregates.Graveling.GPercent)
        ? ((blockAggregates.Graveling.AccumulatedCost / (block.GravelingKm * blockAggregates.Graveling.GPercent / 100) - (block.Graveling / block.GravelingKm)) / (block.Graveling / block.GravelingKm))
        : 0
    },
    RoadConstruction: {
      Km: block.RoadConstructionKm,
      Plan: block.RoadConstruction,
      AccumulatedCost: blockAggregates.RoadConstruction.AccumulatedCost,
      CompleteP: (blockAggregates.RoadConstruction.RPercent || 0) / 100,
      CostPerKm: (blockAggregates.RoadConstruction.AccumulatedCost && block.RoadConstructionKm && blockAggregates.RoadConstruction.RPercent)
        ? blockAggregates.RoadConstruction.AccumulatedCost / (block.RoadConstructionKm * blockAggregates.RoadConstruction.RPercent / 100)
        : 0,
      TargetPerKm: (block.RoadConstruction && block.RoadConstructionKm) ? block.RoadConstruction / block.RoadConstructionKm : 0,
      Var: (blockAggregates.RoadConstruction.AccumulatedCost && block.RoadConstruction && block.RoadConstructionKm && blockAggregates.RoadConstruction.RPercent)
        ? (blockAggregates.RoadConstruction.AccumulatedCost / (block.RoadConstructionKm * blockAggregates.RoadConstruction.RPercent / 100) - (block.RoadConstruction / block.RoadConstructionKm))
        : 0,
      PVar: (blockAggregates.RoadConstruction.AccumulatedCost && block.RoadConstruction && block.RoadConstructionKm && blockAggregates.RoadConstruction.RPercent)
        ? ((blockAggregates.RoadConstruction.AccumulatedCost / (block.RoadConstructionKm * blockAggregates.RoadConstruction.RPercent / 100) - (block.RoadConstruction / block.RoadConstructionKm)) / (block.RoadConstruction / block.RoadConstructionKm))
        : 0
    }
  };
}

function sortByDate(a: any, b: any) {
  const dateA = new Date(a.Date);
  const dateB = new Date(b.Date);
  return dateA.getTime() - dateB.getTime();
}
