-- Migration: Create polls, options, and votes tables
-- Description: Core schema for the voting poll system

-- 1. Create polls table
CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  poll_type text NOT NULL CHECK (poll_type IN ('single_choice', 'multi_choice', 'ranked')),
  deadline timestamptz,
  allow_vote_changes boolean DEFAULT true,
  results_visibility text DEFAULT 'live' CHECK (results_visibility IN ('live', 'after_close')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create poll_options table
CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  option_data jsonb,
  display_order int NOT NULL DEFAULT 0,
  vote_count int DEFAULT 0 CHECK (vote_count >= 0),
  created_at timestamptz DEFAULT now()
);

-- 3. Create poll_votes table
CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  rank int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rank CHECK (rank IS NULL OR rank > 0),
  CONSTRAINT unique_user_vote_option UNIQUE (poll_id, user_id, option_id)
);

-- 4. Create Indexes
CREATE INDEX idx_polls_trip_id ON polls(trip_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_deadline ON polls(deadline) WHERE deadline IS NOT NULL AND status = 'open';
CREATE INDEX idx_polls_created_at ON polls(created_at);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_display_order ON poll_options(poll_id, display_order);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_option_id ON poll_votes(option_id);

-- 5. Trigger to automatically increment/decrement option vote count
CREATE OR REPLACE FUNCTION update_poll_option_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = OLD.option_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.option_id != OLD.option_id THEN
    UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = OLD.option_id;
    UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_poll_vote_count
AFTER INSERT OR UPDATE OR DELETE ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION update_poll_option_vote_count();

-- 6. Trigger to enforce poll choice/rank rules (since PostgreSQL unique indexes cannot query other tables)
CREATE OR REPLACE FUNCTION validate_poll_vote()
RETURNS TRIGGER AS $$
DECLARE
  p_type text;
  already_voted boolean;
BEGIN
  SELECT poll_type INTO p_type FROM polls WHERE id = NEW.poll_id;

  IF p_type = 'single_choice' THEN
    SELECT EXISTS (
      SELECT 1 FROM poll_votes
      WHERE poll_id = NEW.poll_id
        AND user_id = NEW.user_id
        AND id != NEW.id
    ) INTO already_voted;
    IF already_voted THEN
      RAISE EXCEPTION 'User has already voted in this single choice poll';
    END IF;
  ELSIF p_type = 'ranked' THEN
    IF NEW.rank IS NULL THEN
      RAISE EXCEPTION 'Rank is required for ranked polls';
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM poll_votes
      WHERE poll_id = NEW.poll_id
        AND user_id = NEW.user_id
        AND rank = NEW.rank
        AND id != NEW.id
    ) INTO already_voted;
    IF already_voted THEN
      RAISE EXCEPTION 'Duplicate rank in ranked poll';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_poll_vote
BEFORE INSERT OR UPDATE ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION validate_poll_vote();
