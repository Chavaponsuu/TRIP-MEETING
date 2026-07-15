-- Verification Script for Poll Schema and RLS Policies
-- Run this in the Supabase SQL Editor to check if migrations applied correctly.

-- 1. Check if polls tables exist
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = t.table_name
    ) THEN '✓ Exists'
    ELSE '✗ Missing'
  END as status
FROM (
  SELECT 'polls' as table_name
  UNION ALL SELECT 'poll_options'
  UNION ALL SELECT 'poll_votes'
  UNION ALL SELECT 'itinerary_items'
  UNION ALL SELECT 'itinerary_reactions'
  UNION ALL SELECT 'itinerary_comments'
) t;

-- 2. Verify Row Level Security (RLS) is enabled on all tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'trips', 'trip_members', 'polls', 'poll_options', 'poll_votes',
  'itinerary_items', 'itinerary_reactions', 'itinerary_comments'
)
ORDER BY tablename;

-- 3. Verify helper functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name IN ('is_trip_member', 'has_trip_role')
ORDER BY routine_name;

-- 4. Verify triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('trip_members', 'poll_votes')
ORDER BY event_object_table, trigger_name;

-- 5. List all active policies for the affected tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN (
  'trips', 'trip_members', 'polls', 'poll_options', 'poll_votes',
  'itinerary_items', 'itinerary_reactions', 'itinerary_comments'
)
ORDER BY tablename, cmd;
