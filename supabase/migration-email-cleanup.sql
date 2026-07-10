-- Email Notification Cleanup Migration
-- This removes any database triggers for email notifications
-- Use Supabase Database Webhooks instead (configured in Dashboard)
-- Run this in Supabase SQL Editor

-- Drop any existing email notification triggers and functions
drop trigger if exists on_trip_invitation_created on trip_invitations;
drop trigger if exists on_trip_invitation_notify on trip_invitations;
drop function if exists send_trip_invitation_email();
drop function if exists notify_trip_invitation();

-- Note: Email notifications will be handled via Database Webhooks
-- Configure in Supabase Dashboard:
-- Database → Webhooks → Create webhook for trip_invitations (INSERT event)
-- Point to Edge Function: send-trip-invitation-email
