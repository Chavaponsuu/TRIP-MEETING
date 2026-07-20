# Apply Migration 034: Add Onboarding to Profiles

## Overview
This migration adds first-time onboarding support with nickname setup and DiceBear avatars.

## Changes
- Adds `onboarded_at` column to `profiles` table
- Backfills existing users with names as already onboarded
- No changes to RLS policies (onboarding is user-specific)

## Prerequisites
- Database access to Supabase SQL Editor
- Existing `profiles` table

## Steps to Apply

### 1. Run the UP migration

In Supabase SQL Editor, execute:

```sql
-- Add onboarding timestamp to profiles
alter table profiles add column onboarded_at timestamptz;

-- Backfill: mark existing users with names as already onboarded
update profiles
set onboarded_at = created_at
where name is not null and trim(name) <> '';

-- Comment for documentation
comment on column profiles.onboarded_at is 'Timestamp when user completed onboarding. NULL means user needs to complete onboarding.';
```

### 2. Verify the migration

Check that the column was added:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'profiles'
  and column_name = 'onboarded_at';
```

Expected result:
```
column_name   | data_type                   | is_nullable
--------------+-----------------------------+-------------
onboarded_at  | timestamp with time zone    | YES
```

Check backfill results:

```sql
select 
  count(*) as total_users,
  count(onboarded_at) as onboarded_users,
  count(*) - count(onboarded_at) as need_onboarding
from profiles;
```

### 3. Test onboarding flow

1. Create a test user via `/register`
2. Verify they get redirected to `/onboarding`
3. Complete onboarding with a nickname
4. Verify `onboarded_at` is set:

```sql
select id, name, onboarded_at
from profiles
where id = '<test-user-id>';
```

5. Verify user can now access `/dashboard`

## Rollback

If needed, run the DOWN migration:

```sql
-- Remove onboarded_at column from profiles
alter table profiles drop column if exists onboarded_at;
```

## Notes

- Existing users with valid names will NOT see the onboarding screen (backfilled)
- New users or users with empty names will be prompted to complete onboarding
- DiceBear avatars are generated client-side via HTTP API (no storage needed)
- Avatar style is hardcoded to `lorelei` (no database field)

## Related Files

- Migration: `000034_add_onboarding_to_profiles.up.sql`
- Type update: `src/types/index.ts` (Profile interface)
- Component: `src/components/UserAvatar.tsx`
- Page: `src/app/onboarding/page.tsx`
- Layout: `src/app/(app)/layout.tsx` (onboarding check)
