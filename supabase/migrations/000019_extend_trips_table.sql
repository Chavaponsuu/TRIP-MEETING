-- Migration: Extend trips table with lifecycle status, dates, and budget
-- Description: Add status, date_mode, start_date, end_date, budget, currency, cover_image_url columns
-- Dependencies: 000003_create_trips_table
-- Requirements: 1.1, 1.3, 1.4, 1.6

-- Add new columns to existing trips table
ALTER TABLE trips
  ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'confirmed', 'ongoing', 'completed', 'cancelled')),
  ADD COLUMN date_mode text DEFAULT 'flexible' CHECK (date_mode IN ('flexible', 'fixed')),
  ADD COLUMN start_date date,
  ADD COLUMN end_date date,
  ADD COLUMN budget numeric,
  ADD COLUMN currency text DEFAULT 'THB',
  ADD COLUMN cover_image_url text;

-- Add constraint: end_date must be >= start_date when both are provided
ALTER TABLE trips
  ADD CONSTRAINT trips_end_after_start CHECK (
    end_date IS NULL OR 
    start_date IS NULL OR 
    end_date >= start_date
  );

-- Add indexes for performance
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_date ON trips(start_date) WHERE start_date IS NOT NULL;

-- Comments
COMMENT ON COLUMN trips.status IS 'Trip lifecycle status: draft, planning, confirmed, ongoing, completed, cancelled';
COMMENT ON COLUMN trips.date_mode IS 'Date planning mode: flexible (using availabilities) or fixed (confirmed dates)';
COMMENT ON COLUMN trips.start_date IS 'Confirmed start date (when date_mode=fixed)';
COMMENT ON COLUMN trips.end_date IS 'Confirmed end date (when date_mode=fixed)';
COMMENT ON COLUMN trips.budget IS 'Trip budget amount';
COMMENT ON COLUMN trips.currency IS 'Currency code for budget (default THB)';
COMMENT ON COLUMN trips.cover_image_url IS 'URL to trip cover image';
