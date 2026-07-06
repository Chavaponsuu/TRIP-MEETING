-- TripMeet Database Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  avatar_color text default '#5B6FF5',
  created_at timestamptz default now()
);

-- Trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  emoji text default '🗺️',
  description text,
  month int not null check (month between 1 and 12),
  year int not null,
  created_by uuid references profiles(id),
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Trip members
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- Availability (days each user is free)
create table availabilities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  day int not null check (day between 1 and 31),
  unique(trip_id, user_id, day)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#5B6FF5')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security

-- Helper to avoid RLS recursion on trip_members
create or replace function is_trip_member(trip uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from trip_members
    where trip_id = trip and user_id = auth.uid()
  );
$$;

grant execute on function is_trip_member(uuid) to authenticated;

-- profiles
alter table profiles enable row level security;
create policy "Own profile" on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "View profiles of trip members" on profiles for select
  using (exists (
    select 1 from trip_members tm1
    join trip_members tm2 on tm1.trip_id = tm2.trip_id
    where tm1.user_id = auth.uid() and tm2.user_id = profiles.id
  ));

-- trips: only members can view
alter table trips enable row level security;
create policy "Member can view trip" on trips for select
  using (is_trip_member(id));
create policy "Creator can view own trip" on trips for select
  using (created_by = auth.uid());
create policy "Authenticated users can create trips" on trips for insert
  with check (auth.uid() = created_by);
create policy "Creator can update trip" on trips for update
  using (created_by = auth.uid());
create policy "Creator can delete trip" on trips for delete
  using (created_by = auth.uid());

-- trip_members
alter table trip_members enable row level security;
create policy "View members of own trip" on trip_members for select
  using (is_trip_member(trip_id));
create policy "Join trip" on trip_members for insert
  with check (user_id = auth.uid());

-- availabilities
alter table availabilities enable row level security;
create policy "Members read availability" on availabilities for select
  using (is_trip_member(trip_id));
create policy "Write own availability" on availabilities for all
  using (user_id = auth.uid());

-- comments
alter table comments enable row level security;
create policy "Members read comments" on comments for select
  using (is_trip_member(trip_id));
create policy "Write own comments" on comments for insert
  with check (user_id = auth.uid());

-- Public invite lookup (returns limited fields only)
create or replace function get_trip_by_invite(invite text)
returns table (id uuid, name text, destination text, emoji text, month int, year int)
language sql
security definer
set search_path = public
as $$
  select id, name, destination, emoji, month, year
  from trips
  where invite_code = invite;
$$;

grant execute on function get_trip_by_invite(text) to anon, authenticated;

-- Enable Realtime (run in Supabase Dashboard → Database → Replication)
-- Enable replication for: availabilities, comments
