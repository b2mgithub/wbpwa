export interface Block {
  id: string;                        // Required by DataService interface
  BlockId: string;                   // Primary key in IDB
  BlockName?: string;
  Description?: string;
  Division?: string;
  BlockVolume?: number;
  StartDate?: string;
  EndDate?: string;
  Bunching?: number;
  Skidding?: number;
  Decking?: number;
  Processing?: number;
  Loading?: number;
  RoadConstructionKm?: number;
  RoadConstruction?: number;
  GravelingKm?: number;
  Graveling?: number;
  
  // Event sourcing metadata (REQUIRED for all creates/updates)
  BranchTimestamp?: string;          // ISO 8601 string (when data was loaded)
  SubmitTimestamp?: string;          // ISO 8601 string (when save clicked)
  DeviceId?: string;                 // Device identifier
}




