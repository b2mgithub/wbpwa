import { Block } from './blocks.model';

// Example static data. Replace with real data or a loader as needed.
export const blocksData: Block[] = [
  {
    BlockId: '1',
    TimeStamp: new Date(),
    Block: 'Block A',
    Description: 'Demo Block A',
    Division: 'North',
    BlockVolume: 1000,
    StartDate: '2025-01-01',
    EndDate: '2025-12-31',
    Bunching: 100,
    Skidding: 100,
    Decking: 100,
    Processing: 100,
    Loading: 100,
    RoadConstructionKm: 10,
    RoadConstruction: 50000,
    GravelingKm: 5,
    Graveling: 20000
  },
  {
    BlockId: '2',
    TimeStamp: new Date(),
    Block: 'Block B',
    Description: 'Demo Block B',
    Division: 'South',
    BlockVolume: 800,
    StartDate: '2025-01-01',
    EndDate: '2025-12-31',
    Bunching: 80,
    Skidding: 80,
    Decking: 80,
    Processing: 80,
    Loading: 80,
    RoadConstructionKm: 8,
    RoadConstruction: 40000,
    GravelingKm: 4,
    Graveling: 16000
  }
];
