-- Rollback: Remove the poll deadline cron job
SELECT cron.unschedule('close-expired-polls');
