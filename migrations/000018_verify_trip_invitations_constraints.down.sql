-- Migration rollback: Verify and extend trip_invitations table constraints
-- Description: This migration only verifies constraints, so rollback is essentially a no-op
-- Note: We don't drop the constraints as they were part of the original table creation (000014)

-- The constraints checked by this migration (unique and status check) are fundamental
-- to the trip_invitations table design and should not be removed.
-- This down migration exists only for migration system completeness.

-- Log rollback action
DO $$
BEGIN
  RAISE NOTICE 'Rollback of migration 000018: No action needed - constraints are part of original table design';
END $$;
