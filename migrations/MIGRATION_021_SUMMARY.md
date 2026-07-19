# Migration 000021 - Create Itinerary Items Table Summary

## Task 3.1: Create itinerary_items table ✅

### Files Created
1. **`000021_create_itinerary_items_table.up.sql`** - Forward migration
2. **`000021_create_itinerary_items_table.down.sql`** - Rollback migration
3. **`APPLY_MIGRATION_021.md`** - Comprehensive application guide
4. **`MIGRATION_021_SUMMARY.md`** - This summary document

### What This Migration Does

#### 1. New Table Created: `itinerary_items`
Complete day-by-day trip scheduling system with 14 columns:

| Column | Type | Constraint | Purpose |
|--------|------|------------|---------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `trip_id` | uuid | NOT NULL, FK → trips | Trip association |
| `day_number` | int | nullable | Day of trip (1=first day, null=unscheduled) |
| `item_type` | text | NOT NULL, CHECK | Activity type (5 types) |
| `title` | text | NOT NULL | Item title |
| `description` | text | nullable | Detailed description |
| `start_time` | time | nullable | Start time (HH:MM) |
| `end_time` | time | nullable | End time (must be > start_time) |
| `location` | text | nullable | Location/address |
| `status` | text | DEFAULT 'proposed', CHECK | Proposal workflow status |
| `display_order` | int | DEFAULT 0 | Drag-and-drop sort order |
| `created_by` | uuid | NOT NULL, FK → profiles | Creator reference |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Update timestamp |

#### 2. Check Constraints Added
- ✅ **`item_type`**: Must be one of: `travel`, `food`, `activity`, `accommodation`, `free_time`
- ✅ **`status`**: Must be one of: `proposed`, `confirmed`
- ✅ **`valid_time_range`**: Ensures `end_time > start_time` when both provided

#### 3. Foreign Keys Added
- ✅ **`trip_id`** → `trips(id)` ON DELETE CASCADE
- ✅ **`created_by`** → `profiles(id)` ON DELETE CASCADE

#### 4. Indexes Created for Performance
- ✅ **`idx_itinerary_items_trip_id`**: Fast trip lookup
- ✅ **`idx_itinerary_items_day_number`**: Fast day filtering (trip_id, day_number)
- ✅ **`idx_itinerary_items_ordering`**: Composite sorting index (trip_id, day_number, start_time, display_order)
- ✅ **`idx_itinerary_items_status`**: Fast status filtering
- ✅ **`idx_itinerary_items_created_by`**: Fast creator lookup

#### 5. Documentation Comments
All columns and constraints have descriptive SQL comments explaining their purpose.

### Migration Features
- ✅ **Safe**: Uses `IF EXISTS` for rollback operations
- ✅ **Clean**: No data migration needed (new table)
- ✅ **Reversible**: Complete rollback migration provided
- ✅ **Well-indexed**: 5 indexes for optimal query performance
- ✅ **Well-documented**: Inline comments and comprehensive guide

### Rollback Support
The down migration safely removes:
1. All 5 indexes
2. The entire itinerary_items table

⚠️ **WARNING**: Rollback permanently deletes all itinerary data.

### Requirements Mapping

#### ✅ **Requirement 14.1**
- [x] Create table with id, trip_id, day_number, item_type, title, description
- [x] Add start_time, end_time, location columns
- [x] Add status, display_order columns
- [x] Add created_by, created_at, updated_at columns
- [x] Add indexes on trip_id, day_number, ordering fields, status, created_by

#### ✅ **Requirement 14.3**
- [x] Add check constraint for item_type (5 valid values)
- [x] Add check constraint for status (proposed/confirmed)
- [x] Add check constraint for end_time > start_time

### Design Alignment
This migration precisely implements the schema design from `design.md`:
- ✅ Column names match exactly
- ✅ Data types match exactly
- ✅ Constraints match exactly
- ✅ Indexes match exactly
- ✅ Comments provide clear documentation

### Usage Pattern: Proposal → Confirmation Workflow

```
Member creates item → status='proposed' (default)
                   ↓
Organizer reviews → status='confirmed'
                   ↓
All members see confirmed items in timeline
```

### Item Types with Thai Labels
- `travel` → "เดินทาง" 🚗
- `food` → "รับประทานอาหาร" 🍜
- `activity` → "กิจกรรม" 🎭
- `accommodation` → "ที่พัก" 🏨
- `free_time` → "เวลาว่าง" ⏰

### Time Validation Examples

**Valid:**
```sql
start_time='09:00', end_time='12:00'  -- ✅ end > start
start_time='09:00', end_time=NULL     -- ✅ null allowed
start_time=NULL, end_time=NULL        -- ✅ both null allowed
```

**Invalid:**
```sql
start_time='12:00', end_time='09:00'  -- ❌ end before start
```

### Sort Order Logic
Items are ordered by:
1. **day_number** (ascending, nulls last) - unscheduled items at end
2. **start_time** (ascending) - chronological within day
3. **display_order** (ascending) - manual reordering

### Next Steps
After applying this migration:
1. ✅ **Create itinerary_reactions table** (Task 3.2)
2. ✅ **Create itinerary_comments table** (Task 3.3)
3. Add RLS policies for itinerary_items (Task 6.1)
4. Add RLS policies for reactions and comments (Tasks 6.2, 6.3)
5. Enable Supabase Realtime on all 3 tables (Task 23.1)
6. Update TypeScript interfaces (Task 8.4)
7. Create useItinerary hook (Task 13.1)
8. Implement itinerary UI components (Tasks 18.1-18.5)

### Testing Checklist
- [ ] Migration applies without errors
- [ ] Table `itinerary_items` exists
- [ ] All 14 columns exist with correct types
- [ ] All 5 indexes created successfully
- [ ] Check constraints work correctly:
  - [ ] Invalid item_type rejected
  - [ ] Invalid status rejected
  - [ ] end_time < start_time rejected
- [ ] Foreign keys enforce referential integrity
- [ ] Can insert proposed items
- [ ] Can update status to confirmed
- [ ] Items sort correctly by day_number, start_time, display_order
- [ ] Rollback migration works (test in dev only)

### SQL Verification Queries

```sql
-- Verify table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'itinerary_items';

-- Check all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'itinerary_items'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'itinerary_items';

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'itinerary_items';

-- Test insert with valid data
INSERT INTO itinerary_items (
  trip_id, day_number, item_type, title, 
  start_time, end_time, status, created_by
) VALUES (
  (SELECT id FROM trips LIMIT 1),
  1, 'activity', 'Test Activity',
  '09:00', '12:00', 'proposed',
  (SELECT id FROM profiles LIMIT 1)
);

-- Verify insert
SELECT * FROM itinerary_items WHERE title = 'Test Activity';

-- Clean up
DELETE FROM itinerary_items WHERE title = 'Test Activity';
```

### Notes
- Migration number 000021 continues the sequential numbering
- Follows same pattern as existing migrations (structure, comments, documentation)
- No data migration needed (creating new table, not modifying existing)
- Safe to apply - no risk to existing data
- Complete documentation provided for safe application
- Ready for RLS policies and Realtime setup in subsequent tasks

### Dependencies
**Required (must exist before this migration):**
- ✅ Migration 000001: profiles table
- ✅ Migration 000003: trips table

**Related (will be created after):**
- Migration 000022: itinerary_reactions table (Task 3.2)
- Migration 000023: itinerary_comments table (Task 3.3)
- RLS policies for all itinerary tables (Tasks 6.1-6.3)

### Performance Considerations
The composite index `idx_itinerary_items_ordering` enables efficient queries for the most common access pattern:

```sql
-- This query will use the composite index efficiently
SELECT * FROM itinerary_items
WHERE trip_id = 'uuid'
ORDER BY day_number, start_time, display_order;
```

For 100 items per trip, all queries should complete in <10ms.
