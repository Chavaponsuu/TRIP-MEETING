# Migration 000021 - Quick Reference Card

## TL;DR
Creates the `itinerary_items` table for collaborative day-by-day trip scheduling.

---

## Apply Migration (3 Steps)

1. **Open**: [Supabase SQL Editor](https://app.supabase.com) → Your Project → SQL Editor
2. **Copy**: Contents of `migrations/000021_create_itinerary_items_table.up.sql`
3. **Run**: Click the Run button

**Expected Result**: ✅ "Success. No rows returned"

---

## Verify Migration

### Quick Check:
```sql
SELECT COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'itinerary_items';
```
**Expected**: `14` columns

### Full Verification:
```sql
-- Check table exists
\dt itinerary_items

-- Check all indexes
\di idx_itinerary_items_*

-- Verify constraints
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'itinerary_items';
```

---

## Rollback (If Needed)

⚠️ **WARNING**: This deletes all itinerary data permanently.

```sql
-- Run the down migration
\i migrations/000021_create_itinerary_items_table.down.sql
```

---

## What Changed

| What | Change |
|------|--------|
| **New Table** | `itinerary_items` (14 columns) |
| **New Indexes** | 5 indexes for performance |
| **Check Constraints** | item_type, status, time validation |
| **Foreign Keys** | trip_id → trips, created_by → profiles |

---

## Quick Test

```sql
-- Insert test item
INSERT INTO itinerary_items (trip_id, day_number, item_type, title, created_by)
VALUES (
  (SELECT id FROM trips LIMIT 1),
  1,
  'activity',
  'Test Activity',
  (SELECT id FROM profiles LIMIT 1)
);

-- Verify
SELECT * FROM itinerary_items WHERE title = 'Test Activity';

-- Clean up
DELETE FROM itinerary_items WHERE title = 'Test Activity';
```

---

## Item Types
- `travel` → เดินทาง 🚗
- `food` → รับประทานอาหาร 🍜
- `activity` → กิจกรรม 🎭
- `accommodation` → ที่พัก 🏨
- `free_time` → เวลาว่าง ⏰

## Status
- `proposed` → รอยืนยัน
- `confirmed` → ยืนยันแล้ว

---

## Key Details

| Property | Value |
|----------|-------|
| **Migration Number** | 000021 |
| **Type** | CREATE TABLE (new) |
| **Depends On** | 000001 (profiles), 000003 (trips) |
| **Execution Time** | < 1 second |
| **Risk Level** | 🟢 Low (no existing data affected) |
| **Rollback** | Available (deletes table) |

---

## Common Errors

**Error: relation "trips" does not exist**
- Solution: Apply migration 000003 first

**Error: relation "profiles" does not exist**
- Solution: Apply migration 000001 first

**Check constraint violated (time range)**
- Ensure end_time > start_time
- Use 24-hour format: 'HH:MM'

---

## Next Steps
1. Apply this migration ✅
2. Create itinerary_reactions table (Task 3.2)
3. Create itinerary_comments table (Task 3.3)
4. Add RLS policies (Task 6.1)
5. Update TypeScript types (Task 8.4)

---

## Full Documentation
- **Application Guide**: `APPLY_MIGRATION_021.md`
- **Summary**: `MIGRATION_021_SUMMARY.md`
- **Requirements**: Requirements 14.1, 14.3
