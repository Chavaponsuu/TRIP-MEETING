# Migration 000018 - Quick Reference Card

## TL;DR
Verifies that `trip_invitations` table has unique constraint on (trip_id, invitee_id) and status check constraint. Idempotent, safe to run multiple times.

---

## Apply Migration (3 Steps)

1. **Open**: [Supabase SQL Editor](https://app.supabase.com) → Your Project → SQL Editor
2. **Copy**: Contents of `migrations/000018_verify_trip_invitations_constraints.up.sql`
3. **Run**: Click the Run button

**Expected Output**:
```
NOTICE: Unique constraint trip_invitations_trip_id_invitee_id_key already exists
NOTICE: Check constraint trip_invitations_status_check already exists
NOTICE: trip_invitations table structure verified successfully
```

---

## Verify Migration

### Quick Check:
```sql
SELECT conname, contype, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE conrelid = 'trip_invitations'::regclass
  AND conname IN ('trip_invitations_trip_id_invitee_id_key', 'trip_invitations_status_check');
```

**Expected**: 2 rows (unique constraint + check constraint)

### Full Verification:
```bash
# Run the comprehensive verification script
psql -f migrations/VERIFY_MIGRATION_018.sql
```

---

## What It Does

| Check | Action |
|-------|--------|
| Unique constraint missing? | Adds `UNIQUE (trip_id, invitee_id)` |
| Status constraint missing? | Adds `CHECK (status IN ('pending', 'accepted', 'declined'))` |
| Constraints exist? | Logs "already exists" and continues |
| Table structure invalid? | Raises exception with missing column names |

---

## Requirements Met

- ✅ **6.1**: Unique constraint on (trip_id, invitee_id)
- ✅ **6.2**: Status values: pending, accepted, declined

---

## Key Info

| Property | Value |
|----------|-------|
| **Migration Number** | 000018 |
| **Depends On** | 000014 (create_trip_invitations_table) |
| **Execution Time** | < 1 second |
| **Data Modification** | None |
| **Schema Changes** | Conditional (only if constraints missing) |
| **Idempotent** | Yes ✓ |
| **Production Safe** | Yes ✓ |
| **Reversible** | Yes (no-op rollback) |

---

## Test Commands

### Test Unique Constraint:
```sql
-- First insert should succeed
INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
VALUES ('<trip-id>', '<user1-id>', '<user2-id>', 'pending');

-- Second insert with same trip_id + invitee_id should FAIL
INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
VALUES ('<trip-id>', '<user1-id>', '<user2-id>', 'pending');
-- Expected: ERROR: duplicate key value violates unique constraint
```

### Test Status Constraint:
```sql
-- Invalid status should FAIL
INSERT INTO trip_invitations (trip_id, inviter_id, invitee_id, status)
VALUES ('<trip-id>', '<user1-id>', '<user3-id>', 'expired');
-- Expected: ERROR: new row violates check constraint "trip_invitations_status_check"
```

---

## Rollback

```sql
-- Run the down migration (essentially a no-op)
\i migrations/000018_verify_trip_invitations_constraints.down.sql
```

**Note**: Does NOT remove constraints (they're part of original table design).

---

## Files

| File | Purpose |
|------|---------|
| `000018_verify_trip_invitations_constraints.up.sql` | Main migration script |
| `000018_verify_trip_invitations_constraints.down.sql` | Rollback script |
| `APPLY_MIGRATION_018.md` | Detailed application guide |
| `VERIFY_MIGRATION_018.sql` | Automated verification |
| `MIGRATION_018_SUMMARY.md` | Task completion summary |
| `000018_QUICK_REFERENCE.md` | This quick reference |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "table does not exist" | Run migration 000014 first |
| "constraint already exists" | Expected! Migration is idempotent |
| "missing columns: {...}" | Table structure corrupted, re-run 000014 |
| Verification script fails | Check Supabase logs, ensure table exists |

---

## When to Run

✅ **Safe to run**:
- After migration 000014 is applied
- Anytime to verify constraints exist
- Before deploying features that use trip_invitations
- After manual schema modifications

❌ **Don't run if**:
- Migration 000014 hasn't been applied yet
- You're in the middle of another migration

---

## Next Steps

After applying this migration:
1. ✅ Constraints are verified
2. ✅ Data integrity is guaranteed
3. ➡️ Continue with migration 000019 (trips table extension)
4. ➡️ Continue with migration 000020 (trip_members extension)

---

**Task**: 1.4 | **Requirements**: 6.1, 6.2 | **Status**: ✅ Complete
