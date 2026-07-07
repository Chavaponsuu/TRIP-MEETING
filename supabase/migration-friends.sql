-- Friend system & trip invitations migration
-- Run in Supabase SQL Editor

-- Friend requests (pending → accepted/rejected)
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(sender_id, receiver_id),
  check (sender_id != receiver_id)
);

-- Trip invitations (invite friends directly to a trip)
create table trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  inviter_id uuid references profiles(id) on delete cascade not null,
  invitee_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique(trip_id, invitee_id),
  check (inviter_id != invitee_id)
);

-- Helper: check if two users are friends
create or replace function are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from friend_requests
    where status = 'accepted'
      and (
        (sender_id = user_a and receiver_id = user_b)
        or (sender_id = user_b and receiver_id = user_a)
      )
  );
$$;

grant execute on function are_friends(uuid, uuid) to authenticated;

-- Search profiles by name (returns limited public fields)
create or replace function search_profiles(search_query text)
returns table (id uuid, name text, avatar_color text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar_color, p.created_at
  from profiles p
  where p.id != auth.uid()
    and length(trim(search_query)) >= 2
    and p.name ilike '%' || trim(search_query) || '%'
  order by p.name
  limit 20;
$$;

grant execute on function search_profiles(text) to authenticated;

-- Row Level Security

alter table friend_requests enable row level security;

create policy "View own friend requests" on friend_requests for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "Send friend request" on friend_requests for insert
  with check (sender_id = auth.uid());

create policy "Receiver can respond" on friend_requests for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

create policy "Sender can cancel pending" on friend_requests for delete
  using (sender_id = auth.uid() and status = 'pending');

-- Allow viewing friend profiles
create policy "View friend profiles" on profiles for select
  using (are_friends(auth.uid(), id));

alter table trip_invitations enable row level security;

create policy "View related trip invitations" on trip_invitations for select
  using (
    inviter_id = auth.uid()
    or invitee_id = auth.uid()
    or is_trip_member(trip_id)
  );

create policy "Members can invite friends" on trip_invitations for insert
  with check (
    inviter_id = auth.uid()
    and is_trip_member(trip_id)
    and are_friends(auth.uid(), invitee_id)
    and not exists (
      select 1 from trip_members
      where trip_id = trip_invitations.trip_id
        and user_id = trip_invitations.invitee_id
    )
  );

create policy "Invitee can respond" on trip_invitations for update
  using (invitee_id = auth.uid())
  with check (invitee_id = auth.uid());

-- Enable Realtime (Supabase Dashboard → Database → Replication)
-- Enable replication for: friend_requests, trip_invitations
