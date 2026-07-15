-- Migration: Set up pg_cron job to auto-close expired polls
-- Description: Schedules process-poll-deadlines Edge Function every 5 minutes via pg_cron + pg_net
-- Requirements: 12.3, 20.2
--
-- PREREQUISITES (manual steps in Supabase Dashboard → Database → Extensions):
--   1. Enable "pg_cron"  extension
--   2. Enable "pg_net"   extension
--
-- After enabling extensions, run this migration in the SQL Editor.
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your actual values before running.

-- Schedule: every 5 minutes, POST to the process-poll-deadlines Edge Function
SELECT cron.schedule(
  'close-expired-polls',            -- job name (unique)
  '*/5 * * * *',                    -- every 5 minutes
  $$
    SELECT net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-poll-deadlines',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body    := '{}'::jsonb
    )
  $$
);
