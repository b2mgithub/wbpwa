import { DateTimeOffsetString, nowPacificDateTimeOffset } from '@devils-offline/datetime-offset';

// Rate entity model
// NOTE: 'id' field added for DataService compatibility (aliases RateId)
export interface Rate {
  id: string;               // Required by DataService interface (same as RateId)
  RateId: string;           // Primary key in IDB
  Type: string;
  SubType: string;
  Rate: number;
  TimeStamp: DateTimeOffsetString;
}

export function createBlankRate(): Omit<Rate, 'RateId' | 'id'> {
  return {
    Type: '',
    SubType: '',
    Rate: 0,
    TimeStamp: nowPacificDateTimeOffset(),
  };
}
