# DateTimeOffset Implementation Guide

## Angular/TypeScript Side ✅ DONE

### Production Model
```typescript
import { DateTimeOffsetString, nowPacificDateTimeOffset } from '@devils-offline/datetime-offset';

export interface Production {
  ProductionId: string;
  Date: DateTimeOffsetString;        // ✅ Was string, now DateTimeOffsetString
  TimeStamp: DateTimeOffsetString;   // ✅ Was Date, now DateTimeOffsetString
  // ... other fields
}
```

### Form Handling
```typescript
// When loading from store → convert to Date for kendo-datepicker
Date: production.Date ? fromDateTimeOffset(production.Date) : null

// When saving to store → convert from Date to DateTimeOffsetString
Date: formData.Date ? toPacificDateTimeOffset(formData.Date) : ''
```

### What Gets Stored
```typescript
// Example value stored in IDB and sent to server:
"2025-11-08T22:15:30.123-08:00"  // Pacific Time with full offset
```

---

## .NET Core API Side 🔧 YOU NEED TO DO

### 1. C# Model/DTO
```csharp
public class Production
{
    public string ProductionId { get; set; }
    public string BlockId { get; set; }
    public string UserId { get; set; }
    
    // ✅ USE DateTimeOffset - NOT DateTime
    public DateTimeOffset Date { get; set; }
    
    public string Type { get; set; }
    public Harvesting Harvesting { get; set; }
    public RoadConstruction RoadConstruction { get; set; }
    public Graveling Graveling { get; set; }
    
    // ✅ USE DateTimeOffset - NOT DateTime
    public DateTimeOffset TimeStamp { get; set; }
}
```

### 2. Why DateTimeOffset?
- **DateTime** loses timezone info (causes bugs with DST and multi-timezone)
- **DateTimeOffset** preserves the exact moment in time with offset
- Angular sends: `"2025-11-08T22:15:30.123-08:00"`
- .NET parses to: `DateTimeOffset` automatically
- SQL Server stores: `datetimeoffset(7)` with full precision

### 3. JSON Serialization (System.Text.Json)
```csharp
// In Program.cs or Startup.cs
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // DateTimeOffset will auto-serialize to ISO 8601 with offset
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
```

**No special configuration needed!** `DateTimeOffset` serializes to/from ISO 8601 automatically.

---

## SQL Server Side 🗄️ YOU NEED TO DO

### 1. Table Schema
```sql
CREATE TABLE Productions (
    ProductionId NVARCHAR(50) PRIMARY KEY,
    BlockId NVARCHAR(50) NOT NULL,
    UserId NVARCHAR(50) NOT NULL,
    
    -- ✅ USE datetimeoffset(7) - NOT datetime or datetime2
    Date DATETIMEOFFSET(7) NOT NULL,
    
    Type NVARCHAR(50),
    
    -- Store complex objects as JSON
    Harvesting NVARCHAR(MAX),           -- JSON string
    RoadConstruction NVARCHAR(MAX),     -- JSON string
    Graveling NVARCHAR(MAX),            -- JSON string
    
    -- ✅ USE datetimeoffset(7)
    TimeStamp DATETIMEOFFSET(7) NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- Indexes for common queries
CREATE INDEX IX_Productions_Date ON Productions(Date);
CREATE INDEX IX_Productions_BlockId ON Productions(BlockId);
CREATE INDEX IX_Productions_UserId ON Productions(UserId);
```

### 2. Why DATETIMEOFFSET(7)?
- `(7)` = 7 decimal places = 100 nanosecond precision (matches .NET)
- Stores: `2025-11-08 22:15:30.1230000 -08:00`
- Can query across timezones accurately
- DST transitions handled correctly

### 3. Querying Examples
```sql
-- Get today's productions in Pacific Time
SELECT * FROM Productions 
WHERE Date >= CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Pacific Standard Time' AS DATE)

-- Convert to UTC for reporting
SELECT 
    ProductionId,
    Date AT TIME ZONE 'UTC' AS DateUTC,
    TimeStamp AT TIME ZONE 'UTC' AS TimeStampUTC
FROM Productions

-- Group by date (ignoring time)
SELECT 
    CAST(Date AS DATE) AS ProductionDate,
    COUNT(*) AS ProductionCount
FROM Productions
GROUP BY CAST(Date AS DATE)
```

---

## Migration Path

### If you have existing data with DateTime/datetime

```sql
-- Add new columns
ALTER TABLE Productions 
ADD DateNew DATETIMEOFFSET(7),
    TimeStampNew DATETIMEOFFSET(7);

-- Migrate data (assuming old values were in Pacific Time)
UPDATE Productions
SET DateNew = TODATETIMEOFFSET(Date, '-08:00'),
    TimeStampNew = TODATETIMEOFFSET(TimeStamp, '-08:00');

-- Verify data looks correct
SELECT TOP 10 
    Date AS OldDate,
    DateNew AS NewDate,
    TimeStamp AS OldTimeStamp,
    TimeStampNew AS NewTimeStamp
FROM Productions;

-- Drop old columns and rename
ALTER TABLE Productions DROP COLUMN Date, TimeStamp;
EXEC sp_rename 'Productions.DateNew', 'Date', 'COLUMN';
EXEC sp_rename 'Productions.TimeStampNew', 'TimeStamp', 'COLUMN';
```

---

## Summary

| Layer | Type | Example Value |
|-------|------|---------------|
| **Angular** | `DateTimeOffsetString` (alias for `string`) | `"2025-11-08T22:15:30.123-08:00"` |
| **JSON/HTTP** | ISO 8601 string | `"2025-11-08T22:15:30.123-08:00"` |
| **.NET** | `DateTimeOffset` | `new DateTimeOffset(2025, 11, 8, 22, 15, 30, 123, TimeSpan.FromHours(-8))` |
| **SQL Server** | `datetimeoffset(7)` | `2025-11-08 22:15:30.1230000 -08:00` |

✅ **You're done in Angular!**  
🔧 **Update your .NET models to use `DateTimeOffset`**  
🗄️ **Update your SQL tables to use `datetimeoffset(7)`**
