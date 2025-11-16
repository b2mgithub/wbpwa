import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Report, BlockReport, harvestingMetrics } from './report.model';
import { ReportComponent } from './report.component';
import { ProductionsStore } from '../productions/productions.state';
import { Production } from '../productions/productions.model';
import { Block } from '../blocks/blocks.model';
// TODO: Replace with a real blocks signal/store if available
import { blocksData } from '../blocks/blocks.data';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ReportComponent],
  templateUrl: './reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private productionsStore = inject(ProductionsStore);
  // Use the real signal from the store
  productions = this.productionsStore.productions;
  // For blocks, use static data for now
  blocks = signal<Block[]>(blocksData as Block[]);
  userDivision = signal<string>('All');
  pricing = signal<any>({});
  routeDate = signal<Date>(new Date());

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
  const blockAggregates = productions.filter(production => (production.UBlockId === block.UBlockId))
    .sort(sortByDate)
    .reduce((aggregates, production) => {
      return {
        Harvesting: {
          BunchingH: aggregates.Harvesting.BunchingH + (production.Harvesting?.HBunchingH || 0),
          BunchingP: production.Harvesting?.HBunchingP ? production.Harvesting.HBunchingP : aggregates.Harvesting.BunchingP,
          SkiddingH: aggregates.Harvesting.SkiddingH + (production.Harvesting?.HSkiddingH || 0),
          SkiddingP: production.Harvesting?.HSkiddingP ? production.Harvesting.HSkiddingP : aggregates.Harvesting.SkiddingP,
          DeckingH: aggregates.Harvesting.DeckingH + (production.Harvesting?.HDeckingH || 0),
          DeckingP: production.Harvesting?.HDeckingP ? production.Harvesting.HDeckingP : aggregates.Harvesting.DeckingP,
          ProcessingH: aggregates.Harvesting.ProcessingH + (production.Harvesting?.HProcessingH || 0),
          ProcessingP: production.Harvesting?.HProcessingP ? production.Harvesting.HProcessingP : aggregates.Harvesting.ProcessingP,
          LoadingH: aggregates.Harvesting.LoadingH + (production.Harvesting?.HLoadingH || 0),
          LoadingP: production.Harvesting?.HLoadingP ? production.Harvesting.HLoadingP : aggregates.Harvesting.LoadingP,
        },
        Graveling: {
          AccumulatedCost: aggregates.Graveling.AccumulatedCost
            + (pricing[production.Graveling?.GCat1Type] || 0) * (production.Graveling?.GCat1 || 0)
            + (pricing[production.Graveling?.GCat2Type] || 0) * (production.Graveling?.GCat2 || 0)
            + (pricing[production.Graveling?.GHoe1Type] || 0) * (production.Graveling?.GHoe1 || 0)
            + (pricing[production.Graveling?.GHoe2Type] || 0) * (production.Graveling?.GHoe2 || 0)
            + (pricing['RockTruck'] || 0) * (production.Graveling?.GRockTruck || 0)
            + (pricing['Grader'] || 0) * (production.Graveling?.GGrader || 0)
            + (pricing['Packer'] || 0) * (production.Graveling?.GPacker || 0)
            + (pricing['Labour'] || 0) * (production.Graveling?.GLabour || 0),
          GPercent: production.Graveling?.GPercent ? production.Graveling.GPercent : aggregates.Graveling.GPercent
        },
        RoadConstruction: {
          AccumulatedCost: aggregates.RoadConstruction.AccumulatedCost
            + (pricing[production.RoadConstruction?.RCat1Type] || 0) * (production.RoadConstruction?.RCat1 || 0)
            + (pricing[production.RoadConstruction?.RCat2Type] || 0) * (production.RoadConstruction?.RCat2 || 0)
            + (pricing[production.RoadConstruction?.RHoe1Type] || 0) * (production.RoadConstruction?.RHoe1 || 0)
            + (pricing[production.RoadConstruction?.RHoe2Type] || 0) * (production.RoadConstruction?.RHoe2 || 0)
            + (pricing['RockTruck'] || 0) * (production.RoadConstruction?.RRockTruck || 0)
            + (pricing['Grader'] || 0) * (production.RoadConstruction?.RGrader || 0)
            + (pricing['Packer'] || 0) * (production.RoadConstruction?.RPacker || 0)
            + (pricing['Labour'] || 0) * (production.RoadConstruction?.RLabour || 0),
          RPercent: production.RoadConstruction?.RPercent ? production.RoadConstruction.RPercent : aggregates.RoadConstruction.RPercent
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
