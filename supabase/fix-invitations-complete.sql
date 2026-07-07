-- Complete fix for friend requests and trip invitations display issues
-- Run this in Supabase SQL Editor

-- Fix 1: Allow viewing profiles in friend requests and trip invitations
create policy "View profiles in friend requests and invitations" on profiles for select
  using (
    exists (
      select 1 from friend_requests
      where (sender_id = auth.uid() and receiver_id = profiles.id)
         or (receiver_id = auth.uid() and sender_id = profiles.id)
    )
    or exists (
      select 1 from trip_invitations
      where (inviter_id = auth.uid() and invitee_id = profiles.id)
         or (invitee_id = auth.uid() and inviter_id = profiles.id)
    )
  );

-- Fix 2: Allow viewing trip details when you have a pending invitation
create policy "Invitees can view trip details" on trips for select
  using (
    exists (
      select 1 from trip_invitations
      where trip_id = trips.id
        and invitee_id = auth.uid()
        and status = 'pending'
    )
  );
