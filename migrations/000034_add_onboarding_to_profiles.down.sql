-- Remove onboarded_at column from profiles
alter table profiles drop column if exists onboarded_at;
