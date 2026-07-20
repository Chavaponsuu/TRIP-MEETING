-- Add onboarding timestamp to profiles
alter table profiles add column onboarded_at timestamptz;

-- Backfill: mark existing users with names as already onboarded
update profiles
set onboarded_at = created_at
where name is not null and trim(name) <> '';

-- Comment for documentation
comment on column profiles.onboarded_at is 'Timestamp when user completed onboarding. NULL means user needs to complete onboarding.';
