export class Production {
  UProductionId: string;
  UserId: string;
  UBlockId: string;
  Block: string;
  Description: string;
  Division: string;
  StartDate: string;
  EndDate: string;
  Date: string;
  Type: string;
  Harvesting: Harvesting;
  RoadConstruction: RoadConstruction;
  Graveling: Graveling;
  TimeStamp: Date;
}

export interface Harvesting {
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
}

export interface RoadConstruction {
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
}

export interface Graveling {
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
