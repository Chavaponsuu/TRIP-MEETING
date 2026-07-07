# Fix: Friend Requests and Trip Invitations Not Showing Profiles

## Problem
Both friend requests AND trip invitations are not displaying because the Row Level Security (RLS) policies on the `profiles` table don't allow users to view profiles of:
1. People who have sent them friend requests (pending)
2. People who have invited them to trips
3. People they have invited to trips

## Root Cause
The `profiles` table has RLS policies that only allow viewing:
1. Your own profile
2. Profiles of people in the same trip
3. Profiles of accepted friends (from `migration-friends.sql`)

**Missing**: Policies to view profiles when there's a **pending** friend request OR trip invitation between two users.

## Solution

### Step 1: Add Missing RLS Policy (REQUIRED)

Run this SQL in your Supabase SQL Editor:

```sql
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
```

**How to run:**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Paste the SQL above
5. Click "Run" or press Cmd/Ctrl + Enter

### Step 2: Verify It Works

After running the SQL:
1. Reload your app
2. Check the browser console for the debug logs:
   - `Raw friend requests data:` - should show `sender` and `receiver` objects populated
   - `Incoming requests:` - should show requests with full sender profiles
   - `Outgoing requests:` - should show requests with full receiver profiles
   - `Raw trip invitations data:` - should show `inviter` and `trip` objects populated
3. Both friend requests AND trip invitations should now display properly

## Code Changes Made

The following files were updated to handle null profiles gracefully:

### 1. `src/hooks/useFriends.ts`
- Changed query syntax to `*` with joined relations
- Added debug logging to help diagnose issues
- Added `.filter(Boolean)` to remove null profiles from friends list

### 2. `src/hooks/useTripInvitations.ts`
- Changed query syntax to `*` with joined relations
- Added debug logging for both `fetchInvitations` and `fetchSentInvites`

### 3. `src/components/friends/FriendRequests.tsx`
- Filter out requests without valid profiles at the component level
- Use optional chaining (`req.sender?.name`) instead of non-null assertions
- Pass profiles directly to MemberAvatar (which handles nulls)

### 4. `src/components/friends/TripInvitationList.tsx`
- Filter out invitations without valid inviter or trip
- Use optional chaining for safer access
- Pass profiles directly to MemberAvatar

### 5. `src/components/members/MemberAvatar.tsx`
- Already updated to handle `null` profiles with a fallback gray avatar

## Why This Happened

The friend request and trip invitation systems were added after the initial schema, and the RLS policies weren't updated to account for the new use cases:

1. Viewing profiles of people you have **pending** friend requests with
2. Viewing profiles of people who have **invited you to a trip**
3. Viewing profiles of people you have **invited to a trip**

The original policies only covered:
- Own profile (always visible)
- Trip members' profiles (visible if in same trip)  
- Friend profiles (visible after request is accepted)

But pending requests and invitations need to show the sender/inviter's profile, which wasn't covered.

## Testing

### Friend Requests
1. User A sends friend request to User B
2. User B should see User A's name and avatar in incoming requests
3. User A should see User B's name and avatar in pending sent requests

### Trip Invitations
1. User A invites User B to a trip
2. User B should see User A's name and avatar with the invitation
3. User A should see the pending invitation with User B's info

## Cleanup (After Fix Works)

Once confirmed working, you can remove the debug `console.log` statements from:
- `useFriends.ts`
- `useTripInvitations.ts`

```typescript
// Remove these lines:
console.log('Raw friend requests data:', requests)
console.log('Incoming requests:', incoming)
console.log('Outgoing requests:', outgoing)
console.log('Raw trip invitations data:', data)
console.log('Raw sent invites data:', data)
```

## Alternative: Bypass RLS with Security Definer Functions

If you prefer not to expose profiles via RLS, you could create security definer functions for both:

```sql
-- Friend requests with profiles
create or replace function get_friend_requests()
returns table (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  status text,
  created_at timestamptz,
  sender_profile json,
  receiver_profile json
)
language sql
security definer
set search_path = public
as $$
  select 
    fr.id,
    fr.sender_id,
    fr.receiver_id,
    fr.status,
    fr.created_at,
    json_build_object('id', s.id, 'name', s.name, 'avatar_color', s.avatar_color, 'created_at', s.created_at) as sender_profile,
    json_build_object('id', r.id, 'name', r.name, 'avatar_color', r.avatar_color, 'created_at', r.created_at) as receiver_profile
  from friend_requests fr
  left join profiles s on s.id = fr.sender_id
  left join profiles r on r.id = fr.receiver_id
  where fr.sender_id = auth.uid() or fr.receiver_id = auth.uid()
  order by fr.created_at desc;
$$;

grant execute on function get_friend_requests() to authenticated;

-- Trip invitations with profiles
create or replace function get_trip_invitations()
returns table (
  id uuid,
  trip_id uuid,
  inviter_id uuid,
  invitee_id uuid,
  status text,
  created_at timestamptz,
  inviter_profile json,
  trip_info json
)
language sql
security definer
set search_path = public
as $$
  select 
    ti.id,
    ti.trip_id,
    ti.inviter_id,
    ti.invitee_id,
    ti.status,
    ti.created_at,
    json_build_object('id', p.id, 'name', p.name, 'avatar_color', p.avatar_color, 'created_at', p.created_at) as inviter_profile,
    json_build_object('id', t.id, 'name', t.name, 'emoji', t.emoji, 'destination', t.destination) as trip_info
  from trip_invitations ti
  left join profiles p on p.id = ti.inviter_id
  left join trips t on t.id = ti.trip_id
  where ti.invitee_id = auth.uid() and ti.status = 'pending'
  order by ti.created_at desc;
$$;

grant execute on function get_trip_invitations() to authenticated;
```

Then update the hooks to call these functions instead. But the RLS policy approach is simpler and more standard.
