-- Rollback: Remove helper functions and audit table
DROP FUNCTION IF EXISTS confirm_trip_dates(uuid, date, date);
DROP POLICY IF EXISTS "Members can view date confirmations" ON trip_date_confirmations;
DROP TABLE IF EXISTS trip_date_confirmations;
DROP FUNCTION IF EXISTS validate_trip_role(uuid, text[]);
