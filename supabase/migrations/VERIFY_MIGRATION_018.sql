-- Verification Script for Migration 000018
-- Run this to check if trip_invitations table has the required constraints

-- 1. Check if the table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'trip_invitations'
    ) 
    THEN '✓ trip_invitations table exists'
    ELSE '✗ ERROR: trip_invitations table does not exist'
  END as table_check;

-- 2. Check all expected columns exist
SELECT 
  'Column Check' as check_type,
  CASE 
    WHEN COUNT(*) = 6 THEN '✓ All 6 columns present'
    ELSE '✗ ERROR: Expected 6 columns, found ' || COUNT(*)::text
  END as result
FROM information_schema.columns
WHERE table_name = 'trip_invitations'
  AND column_name IN ('id', 'trip_id', 'inviter_id', 'invitee_id', 'status', 'created_at');

-- 3. List all columns for manual verification
SELECT 
  'Column Details' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'trip_invitations'
ORDER BY ordinal_position;

-- 4. Check for unique constraint on (trip_id, invitee_id)
SELECT 
  'Unique Constraint Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'trip_invitations_trip_id_invitee_id_key'
        AND conrelid = 'trip_invitations'::regclass
    ) 
    THEN '✓ Unique constraint on (trip_id, invitee_id) exists'
    ELSE '✗ ERROR: Unique constraint missing'
  END as result;

-- 5. Check for status check constraint
SELECT 
  'Status Constraint Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'trip_invitations_status_check'
        AND conrelid = 'trip_invitations'::regclass
    ) 
    THEN '✓ Status check constraint exists'
    ELSE '✗ ERROR: Status check constraint missing'
  END as result;

-- 6. List all constraints on the table
SELECT 
  'All Constraints' as section,
  con.conname as constraint_name,
  con.contype as constraint_type,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    WHEN 'x' THEN 'EXCLUSION'
    ELSE con.contype::text
  END as type_description,
  pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'trip_invitations'
ORDER BY con.contype, con.conname;

-- 7. Test data integrity (read-only check)
SELECT 
  'Data Integrity Check' as check_type,
  COUNT(*) as total_invitations,
  COUNT(DISTINCT (trip_id, invitee_id)) as unique_combinations,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT (trip_id, invitee_id)) 
    THEN '✓ No duplicate (trip_id, invitee_id) combinations'
    ELSE '✗ WARNING: Found ' || (COUNT(*) - COUNT(DISTINCT (trip_id, invitee_id)))::text || ' duplicates'
  END as uniqueness_result
FROM trip_invitations;

-- 8. Check status values are all valid
SELECT 
  'Status Values Check' as check_type,
  CASE 
    WHEN COUNT(*) = 0 OR MAX(CASE 
      WHEN status NOT IN ('pending', 'accepted', 'declined') THEN 1 
      ELSE 0 
    END) = 0
    THEN '✓ All status values are valid'
    ELSE '✗ WARNING: Found invalid status values'
  END as result,
  COUNT(*) as total_rows
FROM trip_invitations;

-- 9. Show status distribution
SELECT 
  'Status Distribution' as section,
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as percentage
FROM trip_invitations
GROUP BY status
ORDER BY count DESC;

-- 10. Final Summary
SELECT 
  '=== VERIFICATION SUMMARY ===' as summary,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_constraint 
      WHERE conrelid = 'trip_invitations'::regclass 
        AND conname IN ('trip_invitations_trip_id_invitee_id_key', 'trip_invitations_status_check')
    ) = 2
    THEN '✓ PASSED: All required constraints are in place'
    ELSE '✗ FAILED: Some constraints are missing'
  END as verification_result;
