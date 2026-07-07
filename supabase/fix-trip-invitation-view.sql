-- Fix: Allow viewing trip details when you have a pending invitation
-- This allows invitees to see trip name, emoji, destination before accepting

create policy "Invitees can view trip details" on trips for select
  using (
    exists (
      select 1 from trip_invitations
      where trip_id = trips.id
        and invitee_id = auth.uid()
        and status = 'pending'
    )
  );
