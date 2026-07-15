-- Migration: Update RLS policies for trips and trip_members
-- Description: Support role-based updates and RSVP validation

-- 1. Redefine is_trip_member to enforce active membership (rsvp_status != 'removed')
CREATE OR REPLACE FUNCTION is_trip_member(trip uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = trip 
      AND user_id = auth.uid()
      AND coalesce(rsvp_status, 'pending') != 'removed'
  );
$$;

-- 2. Create has_trip_role helper function
CREATE OR REPLACE FUNCTION has_trip_role(trip_id uuid, roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = has_trip_role.trip_id
      AND user_id = auth.uid()
      AND role = ANY(roles)
      AND coalesce(rsvp_status, 'pending') != 'removed'
  );
$$;

GRANT EXECUTE ON FUNCTION has_trip_role(uuid, text[]) TO authenticated;

-- 3. Update trips table policies
DROP POLICY IF EXISTS "Creator can update trip" ON trips;
CREATE POLICY "Owner/co-organizer can update trip" ON trips FOR UPDATE
  USING (has_trip_role(id, ARRAY['owner', 'co_organizer']))
  WITH CHECK (has_trip_role(id, ARRAY['owner', 'co_organizer']));

-- 4. Update trip_members table policies
DROP POLICY IF EXISTS "View members of own trip" ON trip_members;
CREATE POLICY "View members of own trip" ON trip_members FOR SELECT
  USING (
    is_trip_member(trip_id) AND (
      rsvp_status IS DISTINCT FROM 'removed' OR 
      has_trip_role(trip_id, ARRAY['owner', 'co_organizer'])
    )
  );

DROP POLICY IF EXISTS "Members can update own RSVP" ON trip_members;
CREATE POLICY "Members can update own RSVP" ON trip_members FOR UPDATE
  USING (user_id = auth.uid() OR has_trip_role(trip_id, ARRAY['owner']))
  WITH CHECK (user_id = auth.uid() OR has_trip_role(trip_id, ARRAY['owner']));

-- 5. Create business rule trigger for trip_members role and RSVP editing limits
CREATE OR REPLACE FUNCTION validate_member_role_update()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get the role of the user performing the update
  SELECT role INTO current_user_role
  FROM trip_members
  WHERE trip_id = OLD.trip_id AND user_id = auth.uid();

  -- Prevent changing user_id or trip_id
  IF NEW.user_id != OLD.user_id OR NEW.trip_id != OLD.trip_id THEN
    RAISE EXCEPTION 'Cannot change user_id or trip_id';
  END IF;

  -- 1. Prevent removing owner role from the owner/creator
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Cannot remove owner role';
  END IF;

  -- 2. Check permissions for role changes
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_user_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'Only the trip owner can assign or revoke roles';
    END IF;
    IF NEW.role = 'owner' THEN
      RAISE EXCEPTION 'Cannot assign new owner role';
    END IF;
  END IF;

  -- 3. Check permissions for RSVP status changes
  IF NEW.rsvp_status IS DISTINCT FROM OLD.rsvp_status THEN
    IF auth.uid() != OLD.user_id AND current_user_role NOT IN ('owner', 'co_organizer') THEN
      RAISE EXCEPTION 'No permission to update RSVP status for this user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_member_role_update ON trip_members;
CREATE TRIGGER trigger_validate_member_role_update
BEFORE UPDATE ON trip_members
FOR EACH ROW
EXECUTE FUNCTION validate_member_role_update();
