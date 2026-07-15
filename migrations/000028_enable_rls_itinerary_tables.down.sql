-- Migration: Rollback RLS policies for itinerary tables
-- Description: Drops policies and disables RLS on itinerary tables

DROP POLICY IF EXISTS "Users can update/delete own comments" ON itinerary_comments;
DROP POLICY IF EXISTS "Members can add comments" ON itinerary_comments;
DROP POLICY IF EXISTS "Members can view comments" ON itinerary_comments;
DROP POLICY IF EXISTS "Users can manage own reactions" ON itinerary_reactions;
DROP POLICY IF EXISTS "Members can view reactions" ON itinerary_reactions;
DROP POLICY IF EXISTS "Creator/organizers can delete itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Creator/organizers can update itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Members can add itinerary items" ON itinerary_items;
DROP POLICY IF EXISTS "Members can view itinerary items" ON itinerary_items;

ALTER TABLE itinerary_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items DISABLE ROW LEVEL SECURITY;
