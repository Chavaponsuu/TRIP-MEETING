-- Migration: Enable RLS and add policies for polls, options, and votes
-- Description: Enforces membership checks on poll interactions

-- 1. Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- 2. Policies for polls
CREATE POLICY "Members can view polls" ON polls FOR SELECT
  USING (is_trip_member(trip_id));

CREATE POLICY "Owners/co-organizers can create polls" ON polls FOR INSERT
  WITH CHECK (is_trip_member(trip_id) AND has_trip_role(trip_id, ARRAY['owner', 'co_organizer']) AND created_by = auth.uid());

CREATE POLICY "Creator can update own polls" ON polls FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can delete own polls" ON polls FOR DELETE
  USING (created_by = auth.uid());

-- 3. Policies for poll_options
CREATE POLICY "Members can view poll options" ON poll_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_options.poll_id AND is_trip_member(polls.trip_id)
  ));

CREATE POLICY "Poll creator can manage options" ON poll_options FOR ALL
  USING (EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_options.poll_id AND polls.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_id AND polls.created_by = auth.uid()
  ));

-- 4. Policies for poll_votes
CREATE POLICY "Members can view votes" ON poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM polls
    WHERE polls.id = poll_votes.poll_id AND is_trip_member(polls.trip_id)
  ));

CREATE POLICY "Members can cast votes" ON poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_id AND is_trip_member(polls.trip_id)
    )
  );

CREATE POLICY "Users can update/delete own votes" ON poll_votes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
