export interface Report {
  Division: string,
  Blocks: Blocks,
  
}

export interface Blocks {
  Block: string;
  Harvesting: Harvesting;
  RoadConstruction: RoadConstruction;
  Graveling: Graveling;
}

export interface Harvesting {
  Metric: string;
  HPlan: number;
  HSum: number;
  HP: number;
  PMax: number;
  HVar: number;
  PVar: number;
}

export interface RoadConstruction {
  Km: number;
  Plan: number;
  AccumulatedCost: number;
  CompleteP: number;
  CostPerKm: number;
  TargetPerKm: number;
  Var: number;
  PVar: number;
}

export interface Graveling {
  Km: number;
  Plan: number;
  AccumulatedCost: number;
  CompleteP: number;
  CostPerKm: number;
  TargetPerKm: number;
  Var: number;
  PVar: number;
}

export const harvestingMetrics = [
  "Bunching",
  "Skidding",
  "Decking",
  "Processing",
  "Loading"
]