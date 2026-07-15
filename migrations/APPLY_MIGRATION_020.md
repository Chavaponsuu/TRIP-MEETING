# How to Apply Migration 000020 - Trip Members Table Extensions

## Overview
This migration extends the `trip_members` table with role-based permissions, RSVP status tracking, and reminder functionality to support collaborative trip management.

## ⚠️ Important Notes
- **Backup your database** before running this migration
- This migration modifies the `trip_members` table structure
- All existing members will automatically receive default values (role='member', rsvp_status='pending')
- Trip creators will be automatically promoted to role='owner'
- A rollback script is provided if needed

## Steps to Apply

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### 2. Run the Migration
1. Open the file: `migrations/000020_extend_trip_members_table.up.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **Run** button

### 3. Verify Success
After running, you should see a success message. Run this query to verify:
```sql
-- Check the new columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trip_members' 
  AND column_name IN ('role', 'rsvp_status', 'rsvp_updated_at', 'reminder_sent_at');
```

You should see all 4 new columns listed.

### 4. Test the Changes
Run these queries to verify the migration worked:

```sql
-- Check that trip creators have owner role
SELECT tm.user_id, tm.role, t.created_by, t.name
FROM trip_members tm
JOIN trips t ON tm.trip_id = t.id
WHERE tm.role = 'owner'
LIMIT 5;

-- Check default RSVP status for members
SELECT role, rsvp_status, COUNT(*) as count
FROM trip_members
GROUP BY role, rsvp_status;

-- Verify the trigger function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'update_rsvp_timestamp';
```

## Rollback (If Needed)

⚠️ **WARNING**: Rolling back will **permanently delete** all role, RSVP, and reminder data.

If you need to rollback:
1. Open `migrations/000020_extend_trip_members_table.down.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**

The rollback will:
- Drop the `update_rsvp_timestamp()` trigger and function
- Remove all indexes on role and rsvp_status
- Drop all 4 new columns (role, rsvp_status, rsvp_updated_at, reminder_sent_at)

## What This Migration Does

### Columns Added:
1. **`role`** - text, default 'member'
   - Values: 'owner', 'co_organizer', 'member'
   - Defines permission level in the trip
   
2. **`rsvp_status`** - text, default 'pending'
   - Values: 'pending', 'going', 'maybe', 'not_going', 'removed'
   - Tracks member attendance confirmation
   
3. **`rsvp_updated_at`** - timestamptz, nullable
   - Auto-updated by trigger when rsvp_status changes
   - Shows when member last changed their RSVP
   
4. **`reminder_sent_at`** - timestamptz, nullable
   - Tracks when reminder was last sent to this member
   - Used to prevent reminder spam (48-hour throttle)

### Indexes Created:
- `idx_trip_members_role` - for role-based queries
- `idx_trip_members_rsvp_status` - for RSVP filtering

### Trigger Function:
- **`update_rsvp_timestamp()`** - Automatically sets `rsvp_updated_at = now()` whenever `rsvp_status` changes

### Data Backfill:
- All trip creators automatically receive `role = 'owner'`
- Matched via `trip_members.user_id = trips.created_by`

## After Migration

### Expected Default State:
- **Existing members**: role='member', rsvp_status='pending'
- **Trip creators**: role='owner', rsvp_status='pending'
- **New members**: Will use the same defaults

### Application Code Changes Required
Update your TypeScript interfaces to include the new fields:

```typescript
export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'co_organizer' | 'member'
  rsvp_status: 'pending' | 'going' | 'maybe' | 'not_going' | 'removed'
  rsvp_updated_at?: string
  reminder_sent_at?: string
  joined_at: string
  user?: Profile | null
}
```

### Permission Logic Examples:

```typescript
// Check if user can manage trip
const canManage = member.role === 'owner' || member.role === 'co_organizer'

// Filter active members (exclude removed)
const activeMembers = members.filter(m => m.rsvp_status !== 'removed')

// Count confirmed attendees
const goingCount = members.filter(m => m.rsvp_status === 'going').length

// Find members needing reminder
const needsReminder = members.filter(m => 
  m.rsvp_status === 'maybe' && 
  (!m.reminder_sent_at || 
   new Date(m.reminder_sent_at) < new Date(Date.now() - 48 * 60 * 60 * 1000))
)
```

## Testing the Trigger

Test that the `rsvp_updated_at` trigger works correctly:

```sql
-- Update a member's RSVP status
UPDATE trip_members 
SET rsvp_status = 'going' 
WHERE id = (SELECT id FROM trip_members LIMIT 1);

-- Check that rsvp_updated_at was automatically set
SELECT user_id, rsvp_status, rsvp_updated_at
FROM trip_members 
WHERE rsvp_updated_at IS NOT NULL
LIMIT 5;
```

The `rsvp_updated_at` column should now contain a timestamp for updated records.

## Troubleshooting

### Error: "column already exists"
- The migration may have already been applied
- Check current schema:
  ```sql
  \d trip_members
  ```
- If all 4 columns exist, migration is complete

### Error: "trigger already exists"
- The migration uses `CREATE OR REPLACE` and `DROP TRIGGER IF EXISTS`
- This should not cause errors
- If it does, manually drop and recreate:
  ```sql
  DROP TRIGGER IF EXISTS trigger_update_rsvp_timestamp ON trip_members;
  DROP FUNCTION IF EXISTS update_rsvp_timestamp();
  ```
  Then re-run the migration

### Issue: Trip creators don't have owner role
- Check if the backfill query ran:
  ```sql
  SELECT tm.user_id, tm.role, t.created_by
  FROM trip_members tm
  JOIN trips t ON tm.trip_id = t.id
  WHERE tm.user_id = t.created_by;
  ```
- Manually run the backfill if needed:
  ```sql
  UPDATE trip_members tm
  SET role = 'owner'
  FROM trips t
  WHERE tm.trip_id = t.id
    AND tm.user_id = t.created_by
    AND tm.role = 'member';
  ```

## Requirements Satisfied
This migration implements Requirements 2.1, 2.3, 3.1, 3.2, and 7.1 from the specification:
- **Req 2.1**: Role column with owner/co_organizer/member values
- **Req 2.3**: Automatic owner assignment for trip creators
- **Req 3.1**: RSVP status tracking
- **Req 3.2**: Auto-updated rsvp_updated_at timestamp
- **Req 7.1**: reminder_sent_at column for reminder system

## Next Steps
After applying this migration:
1. Update RLS policies to use the new `role` column (Task 4.2)
2. Update TypeScript interfaces (Task 8.2)
3. Implement role-based UI components (Tasks 15-16)
4. Test RSVP functionality with the new columns

## Support
If you encounter issues:
1. Check the Supabase logs in Dashboard → Database → Logs
2. Verify you have necessary permissions (should be owner/admin)
3. Ensure no custom constraints are blocking the ALTER TABLE
4. Check that the `trips` table and `created_by` column exist
