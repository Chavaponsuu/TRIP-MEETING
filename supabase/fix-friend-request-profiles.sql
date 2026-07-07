-- Fix: Allow viewing profiles in friend requests and trip invitations
-- This policy allows users to see profiles of people they have friend requests with
-- AND people who have invited them to trips or who they have invited to trips

create policy "View profiles in friend requests" on profiles for select
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
