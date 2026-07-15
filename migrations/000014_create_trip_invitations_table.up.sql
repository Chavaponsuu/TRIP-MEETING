-- Migration: Create trip_invitations table
-- Description: Direct trip invitations from members to their friends
-- Dependencies: 000001_create_profiles_table, 000003_create_trips_table

-- Trip invitations (invite friends directly to a trip)
CREATE TABLE IF NOT EXISTS trip_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  inviter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, invitee_id),
  CHECK (inviter_id != invitee_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_invitations_trip ON trip_invitations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_inviter ON trip_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_invitee ON trip_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_status ON trip_invitations(status);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_created_at ON trip_invitations(created_at);

-- Comments
COMMENT ON TABLE trip_invitations IS 'Direct trip invitations from members to friends';
COMMENT ON COLUMN trip_invitations.status IS 'Invitation status: pending, accepted, or declined';
COMMENT ON COLUMN trip_invitations.inviter_id IS 'Trip member who sent the invitation';
COMMENT ON COLUMN trip_invitations.invitee_id IS 'Friend who received the invitation';
