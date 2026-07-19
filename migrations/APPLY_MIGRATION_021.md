# How to Apply Migration 000021 - Create Itinerary Items Table

## Overview
This migration creates the `itinerary_items` table to support collaborative day-by-day trip scheduling with a proposal and confirmation workflow. Members can suggest itinerary items, and organizers can approve them.

## ⚠️ Important Notes
- **Backup your database** before running this migration
- This migration creates a **new table** (does not modify existing data)
- No existing data will be affected
- A rollback script is provided if needed
- Requires `trips` and `profiles` tables to exist (dependencies)

## Steps to Apply

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### 2. Run the Migration
1. Open the file: `migrations/000021_create_itinerary_items_table.up.sql`
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **Run** button

### 3. Verify Success
After running, you should see a success message. Run this query to verify:
```sql
-- Check the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'itinerary_items';

-- Check all columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'itinerary_items'
ORDER BY ordinal_position;
```

You should see the `itinerary_items` table with 14 columns.

### 4. Verify Indexes and Constraints
Run this query to verify all indexes were created:
```sql
-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'itinerary_items';
```

You should see 5 indexes:
- `idx_itinerary_items_trip_id`
- `idx_itinerary_items_day_number`
- `idx_itinerary_items_ordering`
- `idx_itinerary_items_status`
- `idx_itinerary_items_created_by`

Check constraints:
```sql
-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'itinerary_items';
```

You should see:
- CHECK constraints for `item_type`, `status`, and `valid_time_range`
- FOREIGN KEY constraints for `trip_id` and `created_by`

## Rollback (If Needed)

If you need to rollback:
1. Open `migrations/000021_create_itinerary_items_table.down.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click **Run**

⚠️ **WARNING**: Rolling back will **permanently delete** the `itinerary_items` table and all itinerary data.

## What This Migration Creates

### Table: `itinerary_items`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | gen_random_uuid() | Primary key |
| `trip_id` | uuid | No | - | Foreign key to trips |
| `day_number` | int | Yes | - | Day of trip (1=first day, null=unscheduled) |
| `item_type` | text | No | - | Type: travel, food, activity, accommodation, free_time |
| `title` | text | No | - | Item title/name |
| `description` | text | Yes | - | Detailed description |
| `start_time` | time | Yes | - | Start time (HH:MM) |
| `end_time` | time | Yes | - | End time (must be > start_time) |
| `location` | text | Yes | - | Location/address |
| `status` | text | No | 'proposed' | Status: proposed or confirmed |
| `display_order` | int | No | 0 | Sort order for drag-and-drop |
| `created_by` | uuid | No | - | Foreign key to profiles |
| `created_at` | timestamptz | No | now() | Creation timestamp |
| `updated_at` | timestamptz | No | now() | Last update timestamp |

### Constraints:
1. **`item_type` CHECK**: Must be one of: travel, food, activity, accommodation, free_time
2. **`status` CHECK**: Must be one of: proposed, confirmed
3. **`valid_time_range` CHECK**: If both start_time and end_time are provided, end_time must be > start_time
4. **Foreign keys**:
   - `trip_id` → trips(id) ON DELETE CASCADE
   - `created_by` → profiles(id) ON DELETE CASCADE

### Indexes (for performance):
1. **`idx_itinerary_items_trip_id`**: Fast lookup of all items in a trip
2. **`idx_itinerary_items_day_number`**: Fast lookup by trip and day
3. **`idx_itinerary_items_ordering`**: Composite index for sorting (trip_id, day_number, start_time, display_order)
4. **`idx_itinerary_items_status`**: Fast filtering by status (proposed vs confirmed)
5. **`idx_itinerary_items_created_by`**: Fast lookup of items created by a user

## After Migration

### TypeScript Interface
Add this interface to your `src/types/index.ts`:

```typescript
export interface ItineraryItem {
  id: string
  trip_id: string
  day_number?: number
  item_type: 'travel' | 'food' | 'activity' | 'accommodation' | 'free_time'
  title: string
  description?: string
  start_time?: string  // HH:MM format
  end_time?: string    // HH:MM format
  location?: string
  status: 'proposed' | 'confirmed'
  display_order: number
  created_by: string
  created_at: string
  updated_at: string
  // Relations (will be added via Supabase select)
  creator?: Profile
  reactions?: ItineraryReaction[]
  comments?: ItineraryComment[]
}
```

### Usage Examples

**Create a proposed itinerary item:**
```typescript
const { data, error } = await supabase
  .from('itinerary_items')
  .insert({
    trip_id: 'uuid-here',
    day_number: 1,
    item_type: 'activity',
    title: 'เที่ยวตลาดน้ำ',
    description: 'ตลาดน้ำดำเนินสะดวก',
    start_time: '09:00',
    end_time: '12:00',
    location: 'ตลาดน้ำดำเนินสะดวก',
    status: 'proposed',
    created_by: user.id
  })
  .select()
  .single()
```

**Get all items for a trip (ordered by day and time):**
```typescript
const { data: items } = await supabase
  .from('itinerary_items')
  .select(`
    *,
    creator:profiles(id, name, avatar_color)
  `)
  .eq('trip_id', tripId)
  .order('day_number', { ascending: true, nullsFirst: false })
  .order('start_time', { ascending: true })
  .order('display_order', { ascending: true })
```

**Confirm a proposed item (organizer only):**
```typescript
const { error } = await supabase
  .from('itinerary_items')
  .update({ status: 'confirmed' })
  .eq('id', itemId)
```

**Get unscheduled items:**
```typescript
const { data: unscheduled } = await supabase
  .from('itinerary_items')
  .select('*')
  .eq('trip_id', tripId)
  .is('day_number', null)
```

## Testing the Table

Test basic CRUD operations:

```sql
-- Insert a test item
INSERT INTO itinerary_items (
  trip_id, 
  day_number, 
  item_type, 
  title, 
  start_time, 
  end_time, 
  status, 
  created_by
) VALUES (
  (SELECT id FROM trips LIMIT 1),
  1,
  'activity',
  'Test Activity',
  '10:00',
  '12:00',
  'proposed',
  (SELECT id FROM profiles LIMIT 1)
);

-- Verify insert
SELECT * FROM itinerary_items ORDER BY created_at DESC LIMIT 1;

-- Test the time range constraint (should fail)
INSERT INTO itinerary_items (
  trip_id, 
  day_number, 
  item_type, 
  title, 
  start_time, 
  end_time,
  created_by
) VALUES (
  (SELECT id FROM trips LIMIT 1),
  1,
  'food',
  'Invalid Time Range',
  '12:00',
  '10:00',  -- End before start - should fail
  (SELECT id FROM profiles LIMIT 1)
);

-- Clean up test data
DELETE FROM itinerary_items WHERE title LIKE 'Test%';
```

## Thai Language Labels for UI

Use these labels in your components:

### Item Types (item_type):
- `travel` → "เดินทาง" 🚗
- `food` → "รับประทานอาหาร" 🍜
- `activity` → "กิจกรรม" 🎭
- `accommodation` → "ที่พัก" 🏨
- `free_time` → "เวลาว่าง" ⏰

### Status:
- `proposed` → "เสนอ" (or "รอยืนยัน")
- `confirmed` → "ยืนยันแล้ว" (or "อนุมัติแล้ว")

## Troubleshooting

### Error: "relation trips does not exist"
- The `trips` table must exist before running this migration
- Ensure migration 000003 (create_trips_table) has been applied

### Error: "relation profiles does not exist"
- The `profiles` table must exist before running this migration
- Ensure migration 000001 (create_profiles_table) has been applied

### Error: "invalid input syntax for type time"
- When inserting times, use 24-hour format: 'HH:MM' (e.g., '14:30')
- Valid: '09:00', '14:30', '23:59'
- Invalid: '9:00', '2:30 PM', '25:00'

### Error: Check constraint "valid_time_range" violated
- Ensure end_time is after start_time
- If one is null, the other can be any value
- Both can be null (no constraint when both null)

## Requirements Satisfied
This migration implements Requirements 14.1 and 14.3 from the specification:
- **Req 14.1**: Create itinerary_items table with all required columns
- **Req 14.3**: Add check constraints for item_type, status, and time validation

## Next Steps
After applying this migration:
1. Create `itinerary_reactions` table (Task 3.2)
2. Create `itinerary_comments` table (Task 3.3)
3. Add RLS policies for itinerary_items (Task 6.1)
4. Enable Realtime replication on itinerary_items (Task 23.1)
5. Update TypeScript interfaces (Task 8.4)
6. Implement itinerary components (Tasks 18.1-18.5)

## Support
If you encounter issues:
1. Check the Supabase logs in Dashboard → Database → Logs
2. Verify dependencies: trips and profiles tables exist
3. Ensure you have necessary permissions (owner/admin)
4. Check foreign key constraints match your existing schema
