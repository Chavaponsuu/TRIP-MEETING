# Dashboard Architecture

## Component Hierarchy

```
DashboardPage (Server Component)
└─ DashboardClient (Client Component) ← State management
   ├─ DashboardHeader
   │  ├─ UserAvatar (from onboarding)
   │  ├─ Button (ใส่รหัสเชิญ)
   │  ├─ Button (สร้างทริป)
   │  └─ JoinByCodeModal (conditional)
   │     ├─ Input (invite code)
   │     └─ Button × 2 (ยกเลิก, เข้าร่วม)
   │
   ├─ PendingInviteBanner (conditional)
   │  └─ Button (ดูรายละเอียด)
   │
   ├─ TripFilterTabs
   │  └─ Button × 3 (tabs with badges)
   │
   ├─ TripCardGrid
   │  └─ DashboardTripCard × N
   │     ├─ Image / Gradient (cover)
   │     ├─ Badge (status)
   │     ├─ AvatarStack
   │     │  └─ UserAvatar × 3 + "+N"
   │     └─ Date text
   │
   ├─ EmptyState (conditional)
   │  └─ Button (สร้างทริปแรก)
   │
   └─ DashboardSkeleton (conditional, loading)
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│  DashboardPage (Server)                                  │
│  - Fetches user + profile                                │
│  - Passes userId + userName to client                    │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│  DashboardClient (Client)                                │
│  - Manages activeFilter state                            │
│  - Calls useMyTrips(userId)                              │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│  useMyTrips Hook                                         │
│  1. Fetch trip_members (user's memberships)              │
│  2. Fetch trips + members (with profiles)                │
│  3. Group into 3 categories                              │
│  4. Subscribe to realtime changes                        │
│  5. Return { trips, loading, error, refetch }            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│  UI Components                                           │
│  - Render based on trips[activeFilter]                   │
│  - Show loading state during fetch                       │
│  - Handle empty states                                   │
└──────────────────────────────────────────────────────────┘
```

## State Management

### Server State (React Server Component)
```typescript
// src/app/(app)/dashboard/page.tsx
- user (from Supabase auth)
- profile.name (from profiles table)
```

### Client State (DashboardClient)
```typescript
// src/components/dashboard/DashboardClient.tsx
- activeFilter: TripFilter           // 'going' | 'pending' | 'completed'
```

### Custom Hook State (useMyTrips)
```typescript
// src/hooks/useMyTrips.ts
- trips: GroupedTrips                 // { going: [], pending: [], completed: [] }
- loading: boolean
- error: string | null
- Realtime subscription channel
```

### Modal State (DashboardHeader)
```typescript
// src/components/dashboard/DashboardHeader.tsx
- showJoinModal: boolean
```

### Form State (JoinByCodeModal)
```typescript
// src/components/dashboard/JoinByCodeModal.tsx
- code: string                        // Invite code input
- loading: boolean                    // Submit loading
- error: string | null                // Validation/API error
```

## Event Flow

### User Clicks "ใส่รหัสเชิญ"
```
DashboardHeader
  ↓ onClick
  ↓ setShowJoinModal(true)
  ↓
JoinByCodeModal renders
  ↓ User types code
  ↓ User clicks "เข้าร่วม"
  ↓ handleSubmit()
  ↓
  ├─ Validate code (8 chars)
  ├─ Query trips table by invite_code
  ├─ Check existing membership
  ├─ Insert trip_members row
  └─ router.push(`/trips/${trip.id}`)
     ↓
     Trip detail page
```

### Realtime Update Received
```
Supabase Realtime Event
  ↓ trip_members or trips UPDATE/INSERT/DELETE
  ↓ Channel callback fires
  ↓
useMyTrips.fetchTrips()
  ↓ Re-query database
  ↓ Update trips state
  ↓
DashboardClient re-renders
  ↓
  ├─ TripFilterTabs (updated counts)
  ├─ TripCardGrid (new/updated trips)
  └─ PendingInviteBanner (new invitations)
```

### User Switches Tab
```
TripFilterTabs
  ↓ onClick tab button
  ↓ onFilterChange(newFilter)
  ↓
DashboardClient.setActiveFilter(newFilter)
  ↓
TripCardGrid re-renders
  ↓ trips={trips[activeFilter]}
  ↓
Display filtered trips or empty state
```

## Supabase Schema Dependencies

### Tables Used
```sql
-- Primary queries
profiles          (id, name, avatar_color)
trip_members      (id, trip_id, user_id, role, rsvp_status, joined_at)
trips             (id, name, destination, emoji, status, date_mode, 
                   start_date, end_date, cover_image_url, invite_code)

-- Realtime subscriptions
trip_members      (all events, filter: user_id)
trips             (UPDATE events, no filter)
```

### RLS Policies Required
```sql
-- User can view their own profile
profiles: "Own profile" FOR SELECT USING (auth.uid() = id)

-- User can view trips they're a member of
trips: "Member can view trip" FOR SELECT 
  USING (EXISTS (SELECT 1 FROM trip_members 
                 WHERE trip_id = trips.id AND user_id = auth.uid()))

-- User can view members of trips they're in
trip_members: "View members of own trip" FOR SELECT
  USING (EXISTS (SELECT 1 FROM trip_members tm 
                 WHERE tm.trip_id = trip_members.trip_id 
                 AND tm.user_id = auth.uid()))

-- User can join trips (INSERT trip_members)
trip_members: "Join trip" FOR INSERT 
  WITH CHECK (user_id = auth.uid())
```

## Performance Considerations

### Initial Load
1. **Server**: 1 query for user + profile
2. **Client**: 2 queries in useMyTrips
   - trip_members WHERE user_id = ?
   - trips WHERE id IN (...) + JOIN trip_members + JOIN profiles
3. **Total**: 3 database queries

### Realtime
- 1 channel subscription per user
- Filters: user_id for trip_members, no filter for trips
- On event: triggers refetch (2 queries again)

### Optimizations Applied
- ✅ Batch fetch trips with members (single query)
- ✅ Filter removed members in SQL (rsvp_status != 'removed')
- ✅ Sort trips once on server (created_at DESC)
- ✅ Group trips in memory (no extra queries)
- ✅ Unsubscribe realtime on unmount (prevent memory leaks)

### Potential Future Optimizations
- 🔄 Add filter to trips realtime subscription (only trips user is in)
- 🔄 Paginate trips for users with 100+ trips
- 🔄 Cache trip list in localStorage with expiry
- 🔄 Lazy load trip member profiles (on hover/click)
- 🔄 Virtual scrolling for very long lists

## Error Handling

### useMyTrips Hook
```typescript
try {
  // Fetch logic
} catch (err) {
  console.error('Error fetching trips:', err)
  setError(err.message || 'เกิดข้อผิดพลาด')
}
```

### JoinByCodeModal
```typescript
// Validation errors
if (code.length !== 8) return setError('รหัสเชิญต้องมี 8 ตัวอักษร')

// Not found error
if (!trip) return setError('ไม่พบทริปนี้ ตรวจสอบรหัสอีกครั้ง')

// Already member (edge case)
if (existingMember) router.push(`/trips/${trip.id}`)

// Removed member (edge case)
if (existingMember.rsvp_status === 'removed') {
  return setError('คุณถูกลบออกจากทริปนี้แล้ว')
}

// API error
catch (err) {
  setError('เกิดข้อผิดพลาดในการเข้าร่วมทริป')
}
```

## Type Safety

All components use strict TypeScript types from `src/types/index.ts`:

```typescript
import type { 
  Trip, 
  TripMember, 
  Profile, 
  TripStatus, 
  RSVPStatus 
} from '@/types'
```

No `any` types used. All props fully typed with interfaces.

## Testing Strategy

### Unit Tests (Future)
- useMyTrips: Mock Supabase client, test grouping logic
- AvatarStack: Test max display, remaining count
- DashboardTripCard: Test gradient generation, date formatting

### Integration Tests (Future)
- Join by code flow: Mock API, test success/error paths
- Filter tabs: Test switching tabs updates displayed trips
- Realtime: Mock channel subscription, test refetch on event

### E2E Tests (Recommended)
- Full user journey: Login → view dashboard → join trip → see new trip
- Responsive: Test on mobile/tablet/desktop viewports
- Realtime: Open 2 sessions, update trip in one, verify other updates
