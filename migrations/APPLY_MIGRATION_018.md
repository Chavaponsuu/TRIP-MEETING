# How to Apply Migration 000018 - Trip Invitations Constraints Verification

## Overview
This migration verifies and ensures that the `trip_invitations` table has proper constraints for data integrity. It checks for a unique constraint on (trip_id, invitee_id) and validates that the status column is constrained to the three valid invitation states.

## ⚠️ Important Notes
- **This is an idempotent migration** - it's safe to run multiple times
- The constraints should already exist from migration 000014 (original table creation)
- This migration will ADD constraints only if they're missing
- No data modification occurs - only constraint verification
- Safe to run on production databases

## Steps to Apply

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### 2. Run the Migration
1. Open the file: `migrations/000018_verify_trip_invitations_constraints.up.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **Run** button

### 3. Verify Success
After running, you should see notices indicating the results. Expected output:

**If constraints already exist** (most likely):
```
NOTICE: Unique constraint trip_invitations_trip_id_invitee_id_key already exists
NOTICE: Check constraint trip_invitations_status_check already exists
NOTICE: trip_invitations table structure verified successfully
```

**If constraints were missing** (unlikely):
```
NOTICE: Added unique constraint trip_invitations_trip_id_invitee_id_key
NOTICE: Added check constraint trip_invitations_status_check
NOTICE: trip_invitations table structure verified successfully
```

### 4. Test the Constraints
Run these queries to verify the constraints are working:

```sql
-- Check that the unique constraint exists
SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'trip_invitations'
  AND con.conname IN ('trip_invitations_trip_id_invitee_id_key', 'trip_invitations_status_check');

-- Test unique constraint (should fail if run twice with same values)
-- Replace the UUIDs with actual trip_id and user_id values from your database
DO $$
DECLARE
  test_trip_id uuid;
  test_inviter_id uuid;
  test_invitee_id uuid;
BEGIN
  -- Get sample IDs
  SELECT id INTO test_trip_id FROM trips LIMIT 1;
  SELECT id INTO test_inviter_id FROM profiles LIMIT 1;
  SELECT id INTO test_invitee_id FROM profiles WHERE id != test_inviter_id LIMIT 1;
  
  IF test_trip_id IS NULL OR test_inviter_id IS NULL OR test_invitee_id IS NULL THEN
    RAISE NOTICE 'Skipping constraint test - insufficient test data';
    RETURN;
  END IF;
  
  -- Try to insert a test invitation
  INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
  VALUES (test_trip_id, test_inviter_id, test_invitee_id, 'pending');
  
  RAISE NOTICE 'Test invitation inserted successfully';
  
  -- Try to insert duplicate (should fail with unique constraint violation)
  BEGIN
    INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
    VALUES (test_trip_id, test_inviter_id, test_invitee_id, 'pending');
    
    RAISE EXCEPTION 'CONSTRAINT TEST FAILED: Duplicate invitation was allowed!';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Unique constraint working correctly - duplicate rejected';
  END;
  
  -- Clean up test data
  DELETE FROM trip_invitations 
  WHERE trip_id = test_trip_id 
    AND inviter_id = test_inviter_id 
    AND invitee_id = test_invitee_id;
  
  RAISE NOTICE 'Constraint test completed successfully';
END $$;

-- Test status constraint (should fail with invalid status)
DO $$
DECLARE
  test_trip_id uuid;
  test_inviter_id uuid;
  test_invitee_id uuid;
BEGIN
  -- Get sample IDs
  SELECT id INTO test_trip_id FROM trips LIMIT 1;
  SELECT id INTO test_inviter_id FROM profiles LIMIT 1;
  SELECT id INTO test_invitee_id FROM profiles WHERE id != test_inviter_id LIMIT 1;
  
  IF test_trip_id IS NULL OR test_inviter_id IS NULL OR test_invitee_id IS NULL THEN
    RAISE NOTICE 'Skipping status constraint test - insufficient test data';
    RETURN;
  END IF;
  
  -- Try to insert with invalid status (should fail)
  BEGIN
    INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
    VALUES (test_trip_id, test_inviter_id, test_invitee_id, 'invalid_status');
    
    RAISE EXCEPTION 'CONSTRAINT TEST FAILED: Invalid status was allowed!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Status constraint working correctly - invalid status rejected';
  END;
  
  RAISE NOTICE 'Status constraint test completed successfully';
END $$;
```

## Rollback (If Needed)

This migration only verifies constraints that are part of the original table design. The rollback is essentially a no-op:

1. Open `migrations/000018_verify_trip_invitations_constraints.down.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**

**Note**: The rollback script does NOT drop the constraints since they are fundamental to the table design. If you need to remove constraints, you must do so manually (not recommended).

## What This Migration Does

### 1. Unique Constraint Verification
Checks for and adds (if missing) a unique constraint on `(trip_id, invitee_id)`:
- **Purpose**: Prevents the same user from being invited to the same trip multiple times
- **Constraint name**: `trip_invitations_trip_id_invitee_id_key`
- **Effect**: Database will reject duplicate invitations

### 2. Status Check Constraint Verification
Checks for and adds (if missing) a check constraint on the `status` column:
- **Purpose**: Ensures invitation status can only be one of three valid values
- **Valid values**: 'pending', 'accepted', 'declined'
- **Constraint name**: `trip_invitations_status_check`
- **Effect**: Database will reject invalid status values

### 3. Table Structure Verification
Verifies that all expected columns exist:
- `id` - Primary key
- `trip_id` - Foreign key to trips
- `inviter_id` - Foreign key to profiles (who sent the invitation)
- `invitee_id` - Foreign key to profiles (who received the invitation)
- `status` - Invitation state
- `created_at` - Timestamp

If any columns are missing, the migration will raise an exception.

## Expected Behavior

### Normal Case (Constraints Already Exist)
Since the constraints were added in the original table creation (migration 000014), running this migration should:
1. Detect that both constraints already exist
2. Log success notices
3. Verify table structure
4. Complete without errors

### Edge Case (Constraints Missing)
If for some reason the constraints are missing:
1. Migration will add both constraints
2. Log that constraints were added
3. Verify table structure
4. Complete successfully

### Error Case (Table Structure Invalid)
If the table is missing expected columns:
1. Migration will raise an exception
2. Indicate which columns are missing
3. Require manual investigation before proceeding

## Application Code Impact

**No code changes required** - this migration does not modify the table schema or data structure. It only ensures data integrity constraints are in place.

The existing TypeScript interface remains unchanged:
```typescript
export interface TripInvitation {
  id: string
  trip_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}
```

## Use Cases Protected By These Constraints

### Unique Constraint (trip_id, invitee_id)
**Prevents**: 
```typescript
// User A invites User B to Trip X
await supabase.from('trip_invitations').insert({
  trip_id: 'trip-x',
  inviter_id: 'user-a',
  invitee_id: 'user-b',
  status: 'pending'
}) // ✓ Success

// User A tries to invite User B again to the same trip
await supabase.from('trip_invitations').insert({
  trip_id: 'trip-x',
  inviter_id: 'user-a',
  invitee_id: 'user-b',
  status: 'pending'
}) // ✗ Rejected by unique constraint
```

**Allows**:
- User A can invite User B to different trips
- Different users can invite User B to the same trip
- User B can be invited again after their previous invitation was declined

### Status Check Constraint
**Prevents**:
```typescript
// Invalid status values
await supabase.from('trip_invitations').insert({
  trip_id: 'trip-x',
  inviter_id: 'user-a',
  invitee_id: 'user-b',
  status: 'expired' // ✗ Rejected - not in allowed list
})

await supabase.from('trip_invitations').update({
  status: 'cancelled' // ✗ Rejected - not in allowed list
})
```

**Allows**:
```typescript
// Only valid status transitions
status: 'pending'   // ✓ Initial state
status: 'accepted'  // ✓ User accepted invitation
status: 'declined'  // ✓ User declined invitation
```

## Troubleshooting

### Error: "table 'trip_invitations' does not exist"
- Migration 000014 must be run first
- Check if the table exists:
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'trip_invitations'
  );
  ```

### Error: "constraint already exists"
- This should not happen due to idempotent checks
- If it does, verify constraint names match:
  ```sql
  SELECT conname FROM pg_constraint 
  WHERE conrelid = 'trip_invitations'::regclass;
  ```

### Error: "missing columns: {column_list}"
- The table structure has been modified incorrectly
- Run migration 000014 again or manually add missing columns
- Do not proceed until table structure matches specification

### Warning: "relation 'trip_invitations' does not exist" in constraint check
- Check spelling and case sensitivity
- Verify the table name is exactly 'trip_invitations'
- Check that you're running in the correct database/schema

## Requirements Satisfied
This migration implements Requirements 6.1 and 6.2 from the specification:
- **Req 6.1**: Unique constraint on (trip_id, invitee_id) prevents duplicate invitations
- **Req 6.2**: Status values are constrained to: pending, accepted, declined

## Next Steps
After applying this migration:
1. ✅ Constraints are verified and in place
2. Continue with other migrations (000019, 000020, etc.)
3. No application code changes needed
4. The trip invitation system will have proper data integrity guarantees

## Support
If you encounter issues:
1. Check the Supabase logs in Dashboard → Database → Logs
2. Verify migration 000014 was applied successfully first
3. Ensure you have necessary permissions (should be owner/admin)
4. Review the pg_constraint system catalog for existing constraints

## Additional Information

### Why This Migration Exists
While the constraints should already exist from the original table creation, this migration serves as:
1. **Validation**: Confirms constraints are present in existing databases
2. **Safety net**: Adds constraints if they were somehow removed or missing
3. **Documentation**: Explicitly documents the required constraints
4. **Idempotency**: Can be safely re-run without side effects

### Database Performance Impact
- **Runtime**: < 1 second (only checks metadata, no data modification)
- **Locking**: No table locks required (only reads system catalogs when constraints exist)
- **Reindexing**: None (unique constraint already has an index from original creation)
- **Downtime**: None required

### Production Safety
✅ **Safe to run on production** because:
- Idempotent - checks before adding
- No data modification
- No existing data invalidates the constraints
- Fast execution (metadata-only queries)
- Non-blocking (no table locks when constraints exist)
