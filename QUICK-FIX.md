# Quick Fix - Friend Requests & Trip Invitations Not Showing

## The Problem
Nothing shows in friend requests or trip invitations because RLS (Row Level Security) blocks:
1. Profile lookups for pending requests/invitations
2. Trip details for invitees who haven't joined yet

## The Complete Fix (Run this SQL in Supabase)

```sql
-- Complete fix for friend requests and trip invitations display issues

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
```

## How to Apply

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste the **entire SQL** above (both policies)
4. Click Run
5. Reload your app

That's it! Both features should work now.

## What This Does

**Policy 1 - Profiles**: Allows you to see profile information (name, avatar) of:
- People who sent you friend requests
- People you sent friend requests to
- People who invited you to trips
- People you invited to trips

**Policy 2 - Trips**: Allows you to see trip details (name, emoji, destination) when:
- Someone has invited you to that trip
- The invitation is still pending

Without these policies, the database blocks these lookups for security reasons, causing the UI to show nothing.

## Troubleshooting

### If you get "policy already exists" error:

Run this first to drop any existing policies:
```sql
drop policy if exists "View profiles in friend requests" on profiles;
drop policy if exists "View profiles in friend requests and invitations" on profiles;
drop policy if exists "Invitees can view trip details" on trips;
```

Then run the complete fix SQL again.

## Check the Browser Console

After applying the fix, open the browser console (F12) and look for:
- `Raw friend requests data:` - should show sender/receiver with full profile objects
- `Raw trip invitations data:` - should show inviter AND trip with full objects

If you still see `null` for profiles or trips after applying the SQL, check the error logs in the console.
