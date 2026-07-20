-- Migration: Enable Realtime Replication for polls tables
-- Description: Ensures realtime updates are broadcast when polls or votes change

ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
