-- Migration: Enable RLS and add policies for itinerary tables
-- Description: Enforces membership checks on itinerary planning

-- 1. Enable RLS
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_comments ENABLE ROW LEVEL SECURITY;

-- 2. Policies for itinerary_items
CREATE POLICY "Members can view itinerary items" ON itinerary_items FOR SELECT
  USING (is_trip_member(trip_id));

CREATE POLICY "Members can add itinerary items" ON itinerary_items FOR INSERT
  WITH CHECK (is_trip_member(trip_id) AND created_by = auth.uid());

CREATE POLICY "Creator/organizers can update itinerary items" ON itinerary_items FOR UPDATE
  USING (created_by = auth.uid() OR has_trip_role(trip_id, ARRAY['owner', 'co_organizer']))
  WITH CHECK (created_by = auth.uid() OR has_trip_role(trip_id, ARRAY['owner', 'co_organizer']));

CREATE POLICY "Creator/organizers can delete itinerary items" ON itinerary_items FOR DELETE
  USING (created_by = auth.uid() OR has_trip_role(trip_id, ARRAY['owner', 'co_organizer']));

-- 3. Policies for itinerary_reactions
CREATE POLICY "Members can view reactions" ON itinerary_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM itinerary_items
    WHERE itinerary_items.id = itinerary_reactions.itinerary_item_id AND is_trip_member(itinerary_items.trip_id)
  ));

CREATE POLICY "Users can manage own reactions" ON itinerary_reactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM itinerary_items
      WHERE itinerary_items.id = itinerary_item_id AND is_trip_member(itinerary_items.trip_id)
    )
  );

-- 4. Policies for itinerary_comments
CREATE POLICY "Members can view comments" ON itinerary_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM itinerary_items
    WHERE itinerary_items.id = itinerary_comments.itinerary_item_id AND is_trip_member(itinerary_items.trip_id)
  ));

CREATE POLICY "Members can add comments" ON itinerary_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM itinerary_items
      WHERE itinerary_items.id = itinerary_item_id AND is_trip_member(itinerary_items.trip_id)
    )
  );

CREATE POLICY "Users can update/delete own comments" ON itinerary_comments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
