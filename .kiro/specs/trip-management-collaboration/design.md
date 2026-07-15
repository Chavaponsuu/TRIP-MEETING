# Design Document: Trip Management & Collaboration

## Overview

This design extends TripMeet with comprehensive trip management and collaboration features including:

- **Extended Trip Attributes**: Trip lifecycle status, confirmed dates, multi-destination support, and budget tracking
- **Role-Based Permissions**: Owner and co-organizer roles for shared trip management responsibilities
- **RSVP System**: Member attendance tracking with reminder functionality
- **Voting System**: Generic poll system for group decisions on accommodations, activities, and other choices
- **Itinerary Planning**: Collaborative day-by-day trip scheduling with reactions and comments
- **Enhanced Date Selection**: Organizer confirmation workflow for finalizing trip dates from availability heatmap

The design maintains compatibility with existing TripMeet architecture (Next.js 14 App Router, Supabase, TypeScript) and follows established patterns for real-time collaboration, RLS policies, and mobile-first UI.

### Key Decisions

1. **Destination Migration**: Migrate `trips.destination` from `text` to `text[]` to support multi-destination trips
2. **Date System**: Continue using existing `availabilities` table for date voting; new `start_date`/`end_date` fields for confirmed dates only
3. **Invite System**: Keep existing `trips.invite_code` for public links; use `trip_invitations` for friend-to-friend invites
4. **Poll Scope**: Generic choice-based polls only (single/multi/ranked); date selection remains in `availabilities`


## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Pages (App Router)                                          │
│  • /trips/[id] (extended with new tabs)                     │
│  • /trips/[id]/settings (new - trip settings)               │
│  • /trips/[id]/itinerary (new - itinerary view)             │
│                                                              │
│  Components                                                  │
│  • RoleManager, RSVPStatus, PollCreator, PollVoteCard       │
│  • ItineraryTimeline, ItineraryItemCard, DateConfirmModal   │
│                                                              │
│  Hooks                                                       │
│  • useTrip (extended), usePolls, useItinerary, useRSVP      │
├─────────────────────────────────────────────────────────────┤
│                      API/Data Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Supabase Client (Browser & Server)                         │
│  • Real-time subscriptions (polls, itinerary, RSVP)         │
│  • RLS enforcement on all tables                            │
├─────────────────────────────────────────────────────────────┤
│                       Database Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Extended Tables:                                            │
│  • trips (status, dates, budget, destination[])             │
│  • trip_members (role, rsvp_status, reminder_sent_at)       │
│                                                              │
│  New Tables:                                                 │
│  • polls, poll_options, poll_votes                          │
│  • itinerary_items, itinerary_reactions, itinerary_comments │
├─────────────────────────────────────────────────────────────┤
│                    Background Services                       │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions                                              │
│  • process-poll-deadlines (cron: every 5 minutes)           │
│                                                              │
│  Database Functions                                          │
│  • validate_trip_role(), confirm_trip_dates()               │
└─────────────────────────────────────────────────────────────┘
```


### Data Flow Patterns

#### Trip Creation with Owner Role
```
User creates trip → trips table INSERT
                 → trip_members INSERT (role='owner', user_id=created_by)
```

#### RSVP Update with Real-time Sync
```
Member updates RSVP → trip_members UPDATE (rsvp_status, rsvp_updated_at)
                   → Realtime broadcast
                   → All trip members see updated status
```

#### Poll Voting Flow
```
Member votes → poll_votes INSERT/UPDATE
            → poll_options.vote_count INCREMENT/DECREMENT
            → Realtime broadcast
            → Live results visible to all (if results_visibility='live')
```

#### Itinerary Collaboration
```
Member adds item → itinerary_items INSERT (status='proposed')
                → Realtime broadcast
                → Organizer confirms → status='confirmed'
                → Members react/comment → Realtime updates
```

#### Date Confirmation
```
Organizer reviews availability heatmap → Selects date range
                                       → confirm_trip_dates(trip_id, start_date, end_date)
                                       → trips UPDATE (start_date, end_date, date_mode='fixed', status='planning')
                                       → Log confirmation action
```


## Components and Interfaces

### Database Schema Extensions

#### 1. Extended `trips` Table

**Migration Strategy**: ALTER TABLE (existing table) with backward-compatible defaults

```sql
-- Add new columns to existing trips table
ALTER TABLE trips
  ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'confirmed', 'ongoing', 'completed', 'cancelled')),
  ADD COLUMN date_mode text DEFAULT 'flexible' CHECK (date_mode IN ('flexible', 'fixed')),
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  ADD COLUMN budget numeric,
  ADD COLUMN currency text DEFAULT 'THB',
  ADD COLUMN cover_image_url text,
  ADD CONSTRAINT end_after_start CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Destination migration: text → text[]
-- Step 1: Add new column
ALTER TABLE trips ADD COLUMN destination_new text[];

-- Step 2: Backfill data
UPDATE trips SET destination_new = ARRAY[destination];

-- Step 3: Verify (check count matches)
-- Step 4: Drop old column and rename
ALTER TABLE trips DROP COLUMN destination;
ALTER TABLE trips RENAME COLUMN destination_new TO destination;
ALTER TABLE trips ALTER COLUMN destination SET NOT NULL;
ALTER TABLE trips ADD CONSTRAINT destination_not_empty CHECK (array_length(destination, 1) >= 1);

-- Add indexes
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date) WHERE start_date IS NOT NULL;
```

**Updated TypeScript Interface**:
```typescript
export interface Trip {
  id: string
  name: string
  destination: string[]  // Changed from string to string[]
  emoji: string
  description?: string
  month: number
  year: number
  months?: TripMonth[]
  status: 'draft' | 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled'
  date_mode: 'flexible' | 'fixed'
  start_date?: string  // ISO date string
  end_date?: string    // ISO date string
  budget?: number
  currency: string
  cover_image_url?: string
  created_by: string
  invite_code: string
  created_at: string
  // Relations
  members?: TripMember[]
  availabilities?: Availability[]
  comments?: Comment[]
}
```


#### 2. Extended `trip_members` Table

**Migration Strategy**: ALTER TABLE with new columns

```sql
-- Add role, RSVP, and reminder columns
ALTER TABLE trip_members
  ADD COLUMN role text DEFAULT 'member' CHECK (role IN ('owner', 'co_organizer', 'member')),
  ADD COLUMN rsvp_status text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'going', 'maybe', 'not_going', 'removed')),
  ADD COLUMN rsvp_updated_at timestamptz,
  ADD COLUMN reminder_sent_at timestamptz;

-- Add indexes
CREATE INDEX idx_trip_members_role ON trip_members(role);
CREATE INDEX idx_trip_members_rsvp_status ON trip_members(rsvp_status);

-- Create trigger to set rsvp_updated_at automatically
CREATE OR REPLACE FUNCTION update_rsvp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rsvp_status IS DISTINCT FROM OLD.rsvp_status THEN
    NEW.rsvp_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rsvp_timestamp
BEFORE UPDATE ON trip_members
FOR EACH ROW
EXECUTE FUNCTION update_rsvp_timestamp();

-- Ensure trip creator becomes owner (backfill for existing trips)
UPDATE trip_members tm
SET role = 'owner'
FROM trips t
WHERE tm.trip_id = t.id
  AND tm.user_id = t.created_by
  AND tm.role = 'member';
```

**Updated TypeScript Interface**:
```typescript
export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'co_organizer' | 'member'
  rsvp_status: 'pending' | 'going' | 'maybe' | 'not_going' | 'removed'
  rsvp_updated_at?: string
  reminder_sent_at?: string
  joined_at: string
  user?: Profile | null
}
```


#### 3. New `polls` Table

```sql
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

CREATE INDEX idx_polls_trip_id ON polls(trip_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_deadline ON polls(deadline) WHERE deadline IS NOT NULL AND status = 'open';
CREATE INDEX idx_polls_created_at ON polls(created_at);

COMMENT ON TABLE polls IS 'Generic choice-based polls for trips (accommodation, activities, etc)';
COMMENT ON COLUMN polls.poll_type IS 'single_choice: one option per user | multi_choice: multiple options | ranked: ordered preferences';
COMMENT ON COLUMN polls.results_visibility IS 'live: show results while voting | after_close: hide until poll closes';
```

**TypeScript Interface**:
```typescript
export interface Poll {
  id: string
  trip_id: string
  created_by: string
  title: string
  description?: string
  poll_type: 'single_choice' | 'multi_choice' | 'ranked'
  deadline?: string
  allow_vote_changes: boolean
  results_visibility: 'live' | 'after_close'
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
  // Relations
  options?: PollOption[]
  votes?: PollVote[]
  creator?: Profile
}
```


#### 4. New `poll_options` Table

```sql
CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  option_data jsonb,  -- For image_url, external_link, etc.
  display_order int NOT NULL DEFAULT 0,
  vote_count int DEFAULT 0 CHECK (vote_count >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_display_order ON poll_options(poll_id, display_order);

COMMENT ON TABLE poll_options IS 'Individual choices available in a poll';
COMMENT ON COLUMN poll_options.option_data IS 'JSONB for extensibility: {image_url, external_link, metadata}';
COMMENT ON COLUMN poll_options.vote_count IS 'Cached count of votes for this option (updated by triggers)';
```

**TypeScript Interface**:
```typescript
export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  option_data?: {
    image_url?: string
    external_link?: string
    metadata?: Record<string, any>
  }
  display_order: number
  vote_count: number
  created_at: string
}
```


#### 5. New `poll_votes` Table

```sql
CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  rank int,  -- Used only for ranked polls (1 = top choice)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rank CHECK (rank IS NULL OR rank > 0)
);

-- For single_choice: unique (poll_id, user_id)
CREATE UNIQUE INDEX idx_poll_votes_single_choice ON poll_votes(poll_id, user_id)
  WHERE (SELECT poll_type FROM polls WHERE id = poll_id) = 'single_choice';

-- For ranked: unique rank per user per poll
CREATE UNIQUE INDEX idx_poll_votes_ranked_unique_rank ON poll_votes(poll_id, user_id, rank)
  WHERE rank IS NOT NULL;

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX idx_poll_votes_option_id ON poll_votes(option_id);

-- Triggers to maintain vote_count
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
```

**TypeScript Interface**:
```typescript
export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_id: string
  rank?: number  // 1 = first choice, 2 = second, etc. (ranked polls only)
  created_at: string
  updated_at: string
  user?: Profile
  option?: PollOption
}
```


#### 6. New `itinerary_items` Table

```sql
CREATE TABLE itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_number int,  -- Nullable for unscheduled items
  item_type text NOT NULL CHECK (item_type IN ('travel', 'food', 'activity', 'accommodation', 'free_time')),
  title text NOT NULL,
  description text,
  start_time time,
  end_time time,
  location text,
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed')),
  display_order int DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_day_number ON itinerary_items(trip_id, day_number);
CREATE INDEX idx_itinerary_items_ordering ON itinerary_items(trip_id, day_number, start_time, display_order);
CREATE INDEX idx_itinerary_items_status ON itinerary_items(status);
CREATE INDEX idx_itinerary_items_created_by ON itinerary_items(created_by);

COMMENT ON TABLE itinerary_items IS 'Day-by-day trip schedule items';
COMMENT ON COLUMN itinerary_items.day_number IS 'Day of trip (1 = first day); null = unscheduled';
COMMENT ON COLUMN itinerary_items.status IS 'proposed: suggestion | confirmed: approved by organizer';
```

**TypeScript Interface**:
```typescript
export interface ItineraryItem {
  id: string
  trip_id: string
  day_number?: number
  item_type: 'travel' | 'food' | 'activity' | 'accommodation' | 'free_time'
  title: string
  description?: string
  start_time?: string  // HH:MM format
  end_time?: string
  location?: string
  status: 'proposed' | 'confirmed'
  display_order: number
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  creator?: Profile
  reactions?: ItineraryReaction[]
  comments?: ItineraryComment[]
}
```


#### 7. New `itinerary_reactions` Table

```sql
CREATE TABLE itinerary_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id uuid REFERENCES itinerary_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('thumbs_up', 'heart', 'fire', 'thinking', 'thumbs_down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_item_id, user_id, reaction_type)
);

CREATE INDEX idx_itinerary_reactions_item_id ON itinerary_reactions(itinerary_item_id);
CREATE INDEX idx_itinerary_reactions_user_id ON itinerary_reactions(user_id);

COMMENT ON TABLE itinerary_reactions IS 'Quick emoji reactions to itinerary items';
```

**TypeScript Interface**:
```typescript
export interface ItineraryReaction {
  id: string
  itinerary_item_id: string
  user_id: string
  reaction_type: 'thumbs_up' | 'heart' | 'fire' | 'thinking' | 'thumbs_down'
  created_at: string
  user?: Profile
}
```

#### 8. New `itinerary_comments` Table

```sql
CREATE TABLE itinerary_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id uuid REFERENCES itinerary_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_itinerary_comments_item_id ON itinerary_comments(itinerary_item_id);
CREATE INDEX idx_itinerary_comments_user_id ON itinerary_comments(user_id);
CREATE INDEX idx_itinerary_comments_created_at ON itinerary_comments(created_at);

COMMENT ON TABLE itinerary_comments IS 'Discussion comments on specific itinerary items';
```

**TypeScript Interface**:
```typescript
export interface ItineraryComment {
  id: string
  itinerary_item_id: string
  user_id: string
  text: string
  created_at: string
  user?: Profile
}
```


#### 9. Extension to `trip_invitations` Table

The table already exists. Migration adds missing constraints if needed:

```sql
-- Verify/add unique constraint on (trip_id, invitee_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_invitations_trip_id_invitee_id_key'
  ) THEN
    ALTER TABLE trip_invitations ADD CONSTRAINT trip_invitations_trip_id_invitee_id_key UNIQUE (trip_id, invitee_id);
  END IF;
END $$;

-- Verify/add status check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_invitations_status_check'
  ) THEN
    ALTER TABLE trip_invitations ADD CONSTRAINT trip_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined'));
  END IF;
END $$;
```

No TypeScript changes needed - interface already exists.


### API Layer / Hook Functions

#### Extended `useTrip` Hook

Extends existing hook with new trip attributes and relationships:

```typescript
// hooks/useTrip.ts (extended)
export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrip = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          members:trip_members(*, user:profiles(*)),
          availabilities(*, user:profiles(*)),
          comments(*, user:profiles(*))
        `)
        .eq('id', tripId)
        .single()

      if (error) setError(error.message)
      else setTrip(data)
      setLoading(false)
    }

    fetchTrip()

    // Real-time subscriptions
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_members',
        filter: `trip_id=eq.${tripId}`,
      }, () => fetchTrip())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      }, () => fetchTrip())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  return { trip, members, loading, error, refetch: () => fetchTrip() }
}
```


#### New `usePolls` Hook

```typescript
// hooks/usePolls.ts
export function usePolls(tripId: string) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolls = async () => {
      const { data } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          votes:poll_votes(*, user:profiles(*), option:poll_options(*)),
          creator:profiles(*)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      setPolls(data || [])
      setLoading(false)
    }

    fetchPolls()

    const channel = supabase
      .channel(`polls-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `trip_id=eq.${tripId}`,
      }, () => fetchPolls())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'poll_votes',
      }, () => fetchPolls())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  const createPoll = async (poll: Omit<Poll, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('polls')
      .insert(poll)
      .select()
      .single()
    return { data, error }
  }

  const vote = async (pollId: string, optionId: string, rank?: number) => {
    const { data: user } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('poll_votes')
      .upsert({
        poll_id: pollId,
        user_id: user.user?.id,
        option_id: optionId,
        rank
      })
    return { error }
  }

  return { polls, loading, createPoll, vote }
}
```


#### New `useItinerary` Hook

```typescript
// hooks/useItinerary.ts
export function useItinerary(tripId: string) {
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          creator:profiles(*),
          reactions:itinerary_reactions(*, user:profiles(*)),
          comments:itinerary_comments(*, user:profiles(*))
        `)
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true, nullsFirst: false })
        .order('start_time', { ascending: true })
        .order('display_order', { ascending: true })

      setItems(data || [])
      setLoading(false)
    }

    fetchItems()

    const channel = supabase
      .channel(`itinerary-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itinerary_items',
        filter: `trip_id=eq.${tripId}`,
      }, () => fetchItems())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itinerary_reactions',
      }, () => fetchItems())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'itinerary_comments',
      }, () => fetchItems())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  const createItem = async (item: Omit<ItineraryItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('itinerary_items')
      .insert(item)
      .select()
      .single()
    return { data, error }
  }

  const updateItemStatus = async (itemId: string, status: 'proposed' | 'confirmed') => {
    const { error } = await supabase
      .from('itinerary_items')
      .update({ status })
      .eq('id', itemId)
    return { error }
  }

  const addReaction = async (itemId: string, reactionType: string) => {
    const { data: user } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('itinerary_reactions')
      .insert({
        itinerary_item_id: itemId,
        user_id: user.user?.id,
        reaction_type: reactionType
      })
    return { error }
  }

  return { items, loading, createItem, updateItemStatus, addReaction }
}
```


#### New `useRSVP` Hook

```typescript
// hooks/useRSVP.ts
export function useRSVP(tripId: string) {
  const [members, setMembers] = useState<TripMember[]>([])

  const updateRSVP = async (status: TripMember['rsvp_status']) => {
    const { data: user } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('trip_members')
      .update({ rsvp_status: status })
      .eq('trip_id', tripId)
      .eq('user_id', user.user?.id)
    return { error }
  }

  const sendReminders = async () => {
    // Get all members with rsvp_status = 'maybe'
    const { data: maybeMembers } = await supabase
      .from('trip_members')
      .select('user_id, reminder_sent_at')
      .eq('trip_id', tripId)
      .eq('rsvp_status', 'maybe')

    // Filter out those reminded in last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const toRemind = maybeMembers?.filter(m =>
      !m.reminder_sent_at || new Date(m.reminder_sent_at) < cutoff
    ) || []

    // Send in-app notifications (implementation depends on notification system)
    // Update reminder_sent_at timestamp
    for (const member of toRemind) {
      await supabase
        .from('trip_members')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('trip_id', tripId)
        .eq('user_id', member.user_id)
    }

    return { remindersSent: toRemind.length }
  }

  return { members, updateRSVP, sendReminders }
}
```

