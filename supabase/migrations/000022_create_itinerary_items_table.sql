-- Migration: Create itinerary_items table
-- Description: Enable collaborative day-by-day trip scheduling with proposal/confirmation workflow
-- Dependencies: 000003_create_trips_table, 000001_create_profiles_table
-- Requirements: 14.1, 14.3

-- Create itinerary_items table
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

-- Add indexes for performance
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_day_number ON itinerary_items(trip_id, day_number);
CREATE INDEX idx_itinerary_items_ordering ON itinerary_items(trip_id, day_number, start_time, display_order);
CREATE INDEX idx_itinerary_items_status ON itinerary_items(status);
CREATE INDEX idx_itinerary_items_created_by ON itinerary_items(created_by);

-- Add comments for documentation
COMMENT ON TABLE itinerary_items IS 'Day-by-day trip schedule items with collaborative proposal and confirmation workflow';
COMMENT ON COLUMN itinerary_items.day_number IS 'Day of trip (1 = first day); null = unscheduled items';
COMMENT ON COLUMN itinerary_items.item_type IS 'Type of activity: travel, food, activity, accommodation, or free_time';
COMMENT ON COLUMN itinerary_items.status IS 'proposed: member suggestion awaiting approval | confirmed: approved by organizer';
COMMENT ON COLUMN itinerary_items.display_order IS 'Sort order for items within the same day/time (for drag-and-drop reordering)';
COMMENT ON COLUMN itinerary_items.start_time IS 'Start time of activity (time only, not date)';
COMMENT ON COLUMN itinerary_items.end_time IS 'End time of activity (must be after start_time if both provided)';
