-- Migration: Add months JSONB column to trips table
-- Description: Supports multiple months selection for trip date planning
-- Requirements: 1.11

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS months jsonb;

COMMENT ON COLUMN trips.months IS 'JSONB array of selected months for flexible date planning: [{month: int, year: int}]';
