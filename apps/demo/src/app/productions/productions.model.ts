import { DateTimeOffsetString, nowPacificDateTimeOffset } from '@devils-offline/datetime-offset';

// Flattened Production entity model
export interface Production {
  id: string;               // Required by DataService interface
  ProductionId: string;     // Primary key in IDB
  BlockId: string;
  UserId: string;
  Date: DateTimeOffsetString;
  TimeStamp: DateTimeOffsetString;
  
  // Harvesting fields (flattened)
  HBunchingH: number;
  HBunchingP: number;
  HSkiddingH: number;
  HSkiddingP: number;
  HDeckingH: number;
  HDeckingP: number;
  HProcessingH: number;
  HProcessingP: number;
  HLoadingH: number;
  HLoadingP: number;
  
  // Road Construction fields (flattened)
  RCat1Type: string;
  RCat1: number;
  RCat2Type: string;
  RCat2: number;
  RHoe1Type: string;
  RHoe1: number;
  RHoe2Type: string;
  RHoe2: number;
  RRockTruck: number;
  RGrader: number;
  RPacker: number;
  RLabour: number;
  RPercent: number;
  
  // Graveling fields (flattened)
  GCat1Type: string;
  GCat1: number;
  GCat2Type: string;
  GCat2: number;
  GHoe1Type: string;
  GHoe1: number;
  GHoe2Type: string;
  GHoe2: number;
  GRockTruck: number;
  GGrader: number;
  GPacker: number;
  GLabour: number;
  GPercent: number;
}

export function createBlankProduction(): Omit<Production, 'ProductionId' | 'id'> {
  return {
    BlockId: '',
    UserId: '',
    Date: nowPacificDateTimeOffset(),
    TimeStamp: nowPacificDateTimeOffset(),
    
    // Harvesting
    HBunchingH: 0, HBunchingP: 0,
    HSkiddingH: 0, HSkiddingP: 0,
    HDeckingH: 0, HDeckingP: 0,
    HProcessingH: 0, HProcessingP: 0,
    HLoadingH: 0, HLoadingP: 0,
    
    // Road Construction
    RCat1Type: '', RCat1: 0,
    RCat2Type: '', RCat2: 0,
    RHoe1Type: '', RHoe1: 0,
    RHoe2Type: '', RHoe2: 0,
    RRockTruck: 0, RGrader: 0,
    RPacker: 0, RLabour: 0,
    RPercent: 0,
    
    // Graveling
    GCat1Type: '', GCat1: 0,
    GCat2Type: '', GCat2: 0,
    GHoe1Type: '', GHoe1: 0,
    GHoe2Type: '', GHoe2: 0,
    GRockTruck: 0, GGrader: 0,
    GPacker: 0, GLabour: 0,
    GPercent: 0,
  };
}