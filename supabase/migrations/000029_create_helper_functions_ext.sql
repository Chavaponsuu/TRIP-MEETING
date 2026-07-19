-- Migration: Create database helper functions for role validation and date confirmation
-- Description: validate_trip_role(), confirm_trip_dates(), trip_date_confirmations audit table
-- Dependencies: 000026_enable_rls_extended_tables (has_trip_role function)
-- Requirements: 1.7, 2.4, 2.5, 12.4, 12.5

-- ─── 9.1 validate_trip_role() ────────────────────────────────────────────────
-- Raises an exception when the current user does NOT hold one of the required roles.
-- Use in application-layer functions and triggers for clean role enforcement.
CREATE OR REPLACE FUNCTION validate_trip_role(p_trip_id uuid, required_roles text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_trip_role(p_trip_id, required_roles) THEN
    RAISE EXCEPTION 'Insufficient role: must be one of %', array_to_string(required_roles, ', ')
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_trip_role(uuid, text[]) TO authenticated;
COMMENT ON FUNCTION validate_trip_role(uuid, text[]) IS
  'Raises an exception if the current user does not hold one of the required roles for the trip';

-- ─── 9.2 Audit table: trip_date_confirmations ────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_date_confirmations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  confirmed_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  confirmed_at timestamptz DEFAULT now() NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_date_confirmations_trip_id
  ON trip_date_confirmations(trip_id);

-- RLS: only trip members can read audit rows; only the function (SECURITY DEFINER) writes
ALTER TABLE trip_date_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view date confirmations"
  ON trip_date_confirmations FOR SELECT
  USING (is_trip_member(trip_id));

COMMENT ON TABLE trip_date_confirmations IS
  'Audit log of every trip date confirmation action';
COMMENT ON COLUMN trip_date_confirmations.confirmed_by IS
  'Profile ID of the owner/co_organizer who confirmed the dates';

-- ─── 9.2 confirm_trip_dates() ────────────────────────────────────────────────
-- Atomically confirms trip dates: validates role, validates date order,
-- updates trips row, and appends an audit entry.
CREATE OR REPLACE FUNCTION confirm_trip_dates(
  p_trip_id    uuid,
  p_start_date date,
  p_end_date   date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Role check (raises if insufficient)
  PERFORM validate_trip_role(p_trip_id, ARRAY['owner', 'co_organizer']);

  -- Date order check
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end_date (%) must be >= start_date (%)', p_end_date, p_start_date
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- Update trip
  UPDATE trips
  SET
    start_date = p_start_date,
    end_date   = p_end_date,
    date_mode  = 'fixed',
    status     = 'confirmed'
  WHERE id = p_trip_id;

  -- Audit log
  INSERT INTO trip_date_confirmations(trip_id, confirmed_by, start_date, end_date)
  VALUES (p_trip_id, auth.uid(), p_start_date, p_end_date);
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_trip_dates(uuid, date, date) TO authenticated;
COMMENT ON FUNCTION confirm_trip_dates(uuid, date, date) IS
  'Confirms trip dates: sets date_mode=fixed, status=confirmed, and logs the action. Requires owner or co_organizer role.';
