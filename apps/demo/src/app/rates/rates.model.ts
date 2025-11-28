import { DateTimeOffsetString, nowPacificDateTimeOffset } from '@wbpwa/datetime-offset';

// Rate entity model
// NOTE: 'id' field added for DataService compatibility (aliases RateId)
export interface Rate {
  id: string;               // Required by DataService interface (same as RateId)
  RateId: string;           // Primary key in IDB
  Type: string;
  SubType: string;
  RateValue: number;
  
  // Event sourcing metadata
  BranchTimestamp?: string;
  SubmitTimestamp?: string;
  DeviceId?: string;
}

export function createBlankRate(): Omit<Rate, 'RateId' | 'id'> {
  return {
    Type: '',
    SubType: '',
    RateValue: 0,
  };
}
