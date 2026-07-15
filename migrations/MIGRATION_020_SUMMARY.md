# Migration 000020 - Trip Members Extensions Summary

## Task 1.3: Create migration for trip_members table extensions ✅

### Files Created
1. **`000020_extend_trip_members_table.up.sql`** - Forward migration
2. **`000020_extend_trip_members_table.down.sql`** - Rollback migration
3. **`APPLY_MIGRATION_020.md`** - Comprehensive application guide

### What This Migration Does

#### 1. New Columns Added
- ✅ `role` (text, default 'member')
  - Values: 'owner', 'co_organizer', 'member'
  - CHECK constraint enforces valid values
  
- ✅ `rsvp_status` (text, default 'pending')
  - Values: 'pending', 'going', 'maybe', 'not_going', 'removed'
  - CHECK constraint enforces valid values
  
- ✅ `rsvp_updated_at` (timestamptz, nullable)
  - Auto-updated by trigger when rsvp_status changes
  
- ✅ `reminder_sent_at` (timestamptz, nullable)
  - Tracks when reminder was sent to member

#### 2. Indexes Created
- ✅ `idx_trip_members_role` - Performance index on role column
- ✅ `idx_trip_members_rsvp_status` - Performance index on rsvp_status column

#### 3. Trigger Function
- ✅ `update_rsvp_timestamp()` - PL/pgSQL function
  - Automatically sets `rsvp_updated_at = now()` when `rsvp_status` changes
  - Uses `IS DISTINCT FROM` to detect actual changes
  
- ✅ `trigger_update_rsvp_timestamp` - BEFORE UPDATE trigger
  - Executes on each row update
  - Calls `update_rsvp_timestamp()` function

#### 4. Data Backfill
- ✅ Existing trip creators automatically promoted to `role = 'owner'`
- ✅ Matches via `trip_members.user_id = trips.created_by`
- ✅ Only updates members currently with `role = 'member'`

### Requirements Satisfied
- ✅ **Requirement 2.1**: ALTER TABLE `trip_members` ADD COLUMN `role`
- ✅ **Requirement 2.3**: Automatic owner assignment for trip creators
- ✅ **Requirement 3.1**: ADD COLUMN `rsvp_status`
- ✅ **Requirement 3.2**: ADD COLUMN `rsvp_updated_at` with auto-update
- ✅ **Requirement 7.1**: ADD COLUMN `reminder_sent_at`

### Migration Features
- ✅ **Idempotent**: Uses `IF NOT EXISTS` where possible
- ✅ **Safe defaults**: All columns have appropriate defaults
- ✅ **Backward compatible**: Existing data preserved
- ✅ **Reversible**: Complete rollback migration provided
- ✅ **Well-documented**: Inline comments and separate guide

### Rollback Support
The down migration safely removes:
1. Trigger and function
2. Both indexes
3. All 4 new columns

⚠️ **Warning**: Rolling back will permanently delete role, RSVP, and reminder data.

### Next Steps
After applying this migration:
1. Run migration 000020 in Supabase SQL Editor
2. Verify columns exist with test queries
3. Update RLS policies (Task 4.2)
4. Update TypeScript interfaces (Task 8.2)
5. Implement role-based UI components

### Testing Checklist
- [ ] Migration applies without errors
- [ ] All 4 columns exist with correct types
- [ ] Indexes created successfully
- [ ] Trigger function exists and works
- [ ] Trip creators have `role = 'owner'`
- [ ] Other members have `role = 'member'`
- [ ] All members have `rsvp_status = 'pending'`
- [ ] Updating rsvp_status sets rsvp_updated_at
- [ ] Rollback migration works (test in dev only)

### SQL Verification Queries

```sql
-- 1. Check columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trip_members' 
  AND column_name IN ('role', 'rsvp_status', 'rsvp_updated_at', 'reminder_sent_at');

-- 2. Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'trip_members' 
  AND indexname IN ('idx_trip_members_role', 'idx_trip_members_rsvp_status');

-- 3. Check trigger function
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'update_rsvp_timestamp';

-- 4. Check trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_rsvp_timestamp';

-- 5. Verify owner backfill
SELECT tm.role, t.created_by, COUNT(*) as count
FROM trip_members tm
JOIN trips t ON tm.trip_id = t.id
WHERE tm.user_id = t.created_by
GROUP BY tm.role, t.created_by;

-- 6. Test trigger (replace with actual member id)
UPDATE trip_members SET rsvp_status = 'going' WHERE id = 'some-uuid';
SELECT rsvp_status, rsvp_updated_at FROM trip_members WHERE id = 'some-uuid';
```

### Design Alignment
This migration precisely implements the schema design from `design.md`:
- Column names match exactly
- Data types match exactly
- CHECK constraints match specified values
- Trigger logic matches specification
- Backfill strategy matches design

### Notes
- Migration number 000020 continues the sequential numbering
- Follows same pattern as existing migrations (000019, 000018, etc.)
- Uses PostgreSQL best practices (IF NOT EXISTS, CREATE OR REPLACE)
- Comprehensive documentation provided for safe application
- All requirements from task 1.3 are satisfied
