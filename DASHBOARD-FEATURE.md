# Dashboard Feature Implementation

## Overview

Redesigned home dashboard page with modern UI, trip filtering, realtime updates, and improved UX for managing trips.

## Features Implemented

### 1. Header Section
- **UserAvatar** integration using DiceBear (Lorelei style)
- Personalized greeting with user's nickname (first name)
- Two action buttons:
  - **"ใส่รหัสเชิญ"** - Opens modal to join trip by invite code
  - **"สร้างทริป"** - Navigate to create new trip page

### 2. Join by Invite Code Modal
- Input field for 8-character invite code
- Validates code against `trips.invite_code` table
- Checks for existing membership before joining
- Handles edge cases:
  - Invalid/not found codes
  - Already a member
  - Removed from trip
- Auto-redirects to trip detail page on success

### 3. Filter Tabs
Three categories with real-time counts:

| Tab | Filter Logic | Display |
|-----|-------------|---------|
| **กำลังจะไป** | `rsvp_status = 'going'` AND `status IN ('draft','planning','confirmed','ongoing')` | Trips user confirmed attendance |
| **ต้องตอบรับ** | `rsvp_status = 'pending'` | Trips awaiting RSVP |
| **ผ่านไปแล้ว** | `status = 'completed'` | Completed trips |

### 4. Trip Card Grid
**Layout:**
- Desktop: 2 columns
- Mobile: 1 column
- Responsive gap and padding

**Each card shows:**
- **Cover Image**: Uses `cover_image_url` or fallback gradient (consistent per trip ID)
- **Status Badge** (bottom-left): Translates `TripStatus` to Thai
- **Title**: Emoji + trip name
- **Destination**: Multi-destination support with " → " separator
- **Avatar Stack**: Overlapping avatars of members with `rsvp_status='going'` (max 3 + count)
- **Date Text** (bottom-right):
  - Fixed mode: "14–16 ธ.ค." format
  - Flexible mode: "รอโหวตวันที่"

### 5. Pending Invite Banner
- Shown when user has pending invitations (except when on "ต้องตอบรับ" tab)
- Displays latest pending trip with:
  - Trip emoji, name, destination
  - "รอการตอบรับจากคุณ" message
  - Count of additional pending trips if > 1
  - "ดูรายละเอียด" button → trip detail page

### 6. Empty States
**No trips at all:**
- Large map emoji (🗺️)
- "ยังไม่มีทริป" message
- CTA to create first trip

**Empty tab:**
- Simple text message per tab
- No blocking UI

### 7. Loading States
- Skeleton components during initial load
- Animated placeholders for:
  - Header (avatar + buttons)
  - Filter tabs
  - Trip cards (4 cards with cover, title, avatars)

### 8. Realtime Updates
Uses Supabase realtime subscriptions to:
- Listen to `trip_members` changes (user's memberships)
- Listen to `trips` table updates (status changes)
- Auto-refetch and update UI without page refresh
- Maintains correct counts on tabs

## File Structure

```
src/
├── app/(app)/dashboard/
│   └── page.tsx                          # Server component, fetches user profile
├── components/dashboard/
│   ├── DashboardClient.tsx               # Main client component with state
│   ├── DashboardHeader.tsx               # Avatar + greeting + action buttons
│   ├── JoinByCodeModal.tsx               # Modal for joining by invite code
│   ├── TripFilterTabs.tsx                # 3 tabs with counts
│   ├── DashboardTripCard.tsx             # Individual trip card with cover
│   ├── TripCardGrid.tsx                  # Responsive grid layout
│   ├── AvatarStack.tsx                   # Overlapping avatar component
│   ├── PendingInviteBanner.tsx           # Warning banner for pending trips
│   ├── EmptyState.tsx                    # Empty states (no trips / no tab results)
│   ├── DashboardSkeleton.tsx             # Loading skeleton
│   └── index.ts                          # Barrel export
└── hooks/
    └── useMyTrips.ts                     # Query + realtime hook
```

## Database Queries

### useMyTrips Hook
```typescript
// 1. Get user's trip memberships (exclude removed)
SELECT trip_id, role, rsvp_status 
FROM trip_members 
WHERE user_id = ? AND rsvp_status != 'removed'

// 2. Fetch trips with members
SELECT trips.*, 
       trip_members.* (with profiles)
FROM trips
WHERE id IN (user's trip_ids)
ORDER BY created_at DESC

// 3. Group by category logic (in-memory)
```

### Join by Code
```typescript
// 1. Find trip by invite code
SELECT id, name, emoji 
FROM trips 
WHERE invite_code = ?

// 2. Check existing membership
SELECT id, rsvp_status 
FROM trip_members 
WHERE trip_id = ? AND user_id = ?

// 3. Insert membership
INSERT INTO trip_members 
(trip_id, user_id, role, rsvp_status) 
VALUES (?, ?, 'member', 'going')
```

## Design Tokens Used

| Element | Style |
|---------|-------|
| Cover gradient fallback | 6 predefined gradients (hash from trip ID) |
| Status badge | Colored background with border |
| Avatar stack | -25% overlap, white border |
| Tab active state | `border-primary`, `text-primary` |
| Tab badge | Primary color background when active |
| Card hover | `shadow-md`, `border-primary/30` |
| Card active | `scale-[0.98]` |

## Mobile Optimizations

1. **Header buttons**: Show shortened text on small screens
   - Desktop: "ใส่รหัสเชิญ" / "สร้างทริป"
   - Mobile: "รหัสเชิญ" / "ทริปใหม่"

2. **Grid layout**: Single column on < 768px

3. **Avatar stack**: Maintains overlap on mobile (no wrap)

4. **Modal**: Full-width with padding on mobile

5. **Filter tabs**: Horizontal scroll with overflow-x-auto

## Usage Example

```typescript
// Server Component (page.tsx)
import { DashboardClient } from '@/components/dashboard'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const profile = await getProfile(user.id)
  
  return <DashboardClient userId={user.id} userName={profile.name} />
}
```

## Testing Checklist

- [ ] Dashboard loads without errors
- [ ] UserAvatar displays correctly
- [ ] Filter tabs show correct counts
- [ ] Clicking tabs switches displayed trips
- [ ] Join by code modal opens/closes
- [ ] Valid invite code joins trip successfully
- [ ] Invalid invite code shows error
- [ ] Pending banner shows when applicable
- [ ] Pending banner hides on "ต้องตอบรับ" tab
- [ ] Avatar stack shows max 3 + count
- [ ] Empty states display correctly
- [ ] Loading skeleton shows during fetch
- [ ] Realtime updates work (add/remove member in another tab)
- [ ] Mobile responsive layout works
- [ ] Trip cards navigate to detail page

## Known Limitations

1. **Cover images**: Requires valid URL, no upload UI in this implementation
2. **Gradient fallback**: Uses hash function, could have color collisions
3. **Realtime**: Subscribes to ALL trips table updates (could be optimized with filter)
4. **Performance**: Fetches all trip members, could paginate for large datasets

## Future Enhancements

1. Add trip search/filter by name
2. Sort options (date, name, created)
3. List vs Grid view toggle
4. Quick RSVP from card (without opening detail)
5. Drag-and-drop to reorder trips
6. Archive/hide completed trips
7. Trip stats preview on hover
8. Batch operations (archive multiple, etc.)

## Related Features

- **Onboarding**: Uses same UserAvatar component
- **Trip Detail**: Navigation target from cards
- **Create Trip**: Navigation target from header button
- **RSVP System**: Drives the "ต้องตอบรับ" tab logic

## Performance Notes

- Initial load: ~2-3 queries (memberships → trips → profiles)
- Realtime: Minimal overhead, channel subscription on mount
- Images: Uses Next.js Image component with proper sizing
- Skeleton: Prevents layout shift during load
