# How to Apply Migration 000019 - Destination Array Migration

## Overview
This migration converts the `trips.destination` field from a single text value to an array of text values (`text[]`), enabling multi-destination trip support.

## ⚠️ Important Notes
- **Backup your database** before running this migration
- This migration modifies the `trips` table structure
- All existing single destinations will be preserved as single-element arrays
- The migration includes automatic verification steps
- A rollback script is provided if needed

## Steps to Apply

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### 2. Run the Migration
1. Open the file: `migrations/000019_migrate_destination_to_array.up.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **Run** button

### 3. Verify Success
The migration includes automatic verification. After running, you should see:
```
NOTICE: Backfill verification passed: all rows successfully migrated
```

If you see an error instead, **DO NOT PROCEED** - contact support or investigate the issue.

### 4. Test the Changes
Run this query to verify the migration worked:
```sql
-- Check a few sample trips to see destinations as arrays
SELECT id, name, destination, array_length(destination, 1) as dest_count
FROM trips
LIMIT 5;
```

You should see:
- `destination` column showing PostgreSQL array notation: `{Bangkok}`
- `dest_count` should be `1` for all existing trips

## Rollback (If Needed)

⚠️ **WARNING**: Rolling back will **lose data** if any trips have multiple destinations added after migration.

If you need to rollback:
1. Open `migrations/000019_migrate_destination_to_array.down.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**

The rollback will:
- Convert arrays back to single text values
- Keep only the **first destination** if multiple exist
- Warn you about data loss before proceeding

## What This Migration Does

### Step-by-Step Process:
1. **Adds new column**: `destination_new text[]` (nullable)
2. **Backfills data**: Converts each existing `destination` to `ARRAY[destination]`
3. **Verifies**: Checks that all rows were migrated successfully
4. **Drops old column**: Removes the original `destination` column
5. **Renames**: Renames `destination_new` → `destination`
6. **Adds constraints**: 
   - `NOT NULL` - ensures destination is always present
   - `CHECK (array_length(destination, 1) >= 1)` - ensures at least one destination

## After Migration

### Application Code Changes Required
After applying this migration, update your application code to handle `destination` as an array:

```typescript
// Before (single string):
trip.destination  // "Bangkok"

// After (array):
trip.destination  // ["Bangkok"] or ["Bangkok", "Chiang Mai"]
trip.destination[0]  // "Bangkok"
trip.destination.join(", ")  // "Bangkok, Chiang Mai"
```

See the TypeScript type updates in task 8.1 for the updated `Trip` interface.

## Troubleshooting

### Error: "Backfill verification failed"
- This means some trips have `destination` but the new column is NULL
- Check for any database triggers or constraints blocking the UPDATE
- Manually inspect affected rows: 
  ```sql
  SELECT * FROM trips WHERE destination IS NOT NULL AND destination_new IS NULL;
  ```

### Error: "column already exists"
- The migration may have partially run before
- Check current schema:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'trips' AND column_name LIKE '%destination%';
  ```
- If `destination` is already `ARRAY`, the migration is complete
- If both `destination` and `destination_new` exist, the migration was interrupted

## Support
If you encounter issues:
1. Check the Supabase logs in Dashboard → Database → Logs
2. Verify RLS policies are not blocking the UPDATE operation
3. Ensure you have necessary permissions (should be owner/admin)

## Requirements Satisfied
This migration implements Requirements 1.8, 1.9, 1.10, and 1.11 from the specification.
