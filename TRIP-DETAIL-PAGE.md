# Trip Detail Page Implementation

## Overview

Implemented a comprehensive Trip Detail Page with 6 main sections following the requirements specification. The page is mobile-first, uses Thai language throughout, and includes real-time updates via Supabase subscriptions.

## Deliverables

### 1. New Components Created

#### `/src/hooks/useTripRole.ts`
Permission hook that returns the current user's role and permissions for a trip:
- `role`: owner | co_organizer | member
- `isOwner`: boolean
- `isOrganizer`: boolean (owner OR co_organizer)
- `canEdit`, `canManageMembers`, `canConfirmItems`, `canConfirmDates`: permission flags

#### `/src/components/trip/MetricCards.tsx`
Three-column grid displaying:
- **วันที่** (Date): Shows fixed dates or "รอโหวต" with link to availability section
- **งบประมาณ** (Budget): Formatted budget per person or "ยังไม่ระบุ"
- **รหัสเชิญ** (Invite Code): Display code with copy button and regenerate button (owner/co_organizer only)

#### `/src/components/members/MemberListWithRSVP.tsx`
Member management component with:
- Real-time member list with RSVP status badges
- Avatar display with profile colors
- Role badges (owner/co_organizer)
- Kick member functionality (for organizers)
- Invite friends modal with copy link
- Realtime subscription on `trip_members` table

#### `/src/components/calendar/AvailabilityHeatmap.tsx`
Interactive availability calendar with:
- Heat-colored cells (teal gradient) based on percentage of members available
- 5-level color scale: 0%, 1-25%, 26-50%, 51-75%, 76-100%
- Multi-month support with month selector
- Date confirmation mode for organizers
- Current user availability indicator (blue dot)
- Realtime subscription with 500ms debounce
- Hover tooltips showing who is available
- Legend explaining colors and symbols

### 2. Updated Components

#### `/src/app/(app)/trips/[id]/page.tsx`
Restructured from tab-based to 6-section vertical layout:

**Section 1: Trip Header**
- Emoji + name + destination (multi-destination support with →)
- Status badge (translated to Thai)
- Going count
- "จัดการทริป" button (organizers only)

**Section 2: Metric Cards**
- Date, Budget, Invite Code in 3-column grid

**Section 3: Member List with RSVP**
- All members with RSVP status
- Realtime updates
- Invite and manage functionality

**Section 4: Availability Heatmap**
- Toggle between edit mode (select your dates) and heatmap view
- Multi-month selector
- Date confirmation for organizers

**Section 5: Polls**
- Poll creator (organizers only)
- Poll cards with voting interface
- Realtime vote updates

**Section 6: Itinerary**
- Timeline view grouped by day
- Add activity button (all members)
- Confirm/edit/delete based on permissions

#### `/src/components/ui/Badge.tsx`
Extended to support more variants:
- Added `warning`, `danger`, `muted` variants
- Added `size` prop: `sm | md`

#### `/src/components/ui/Toast.tsx`
Added standalone `Toast` component export for simple toast notifications

### 3. Database Features Used

#### Realtime Subscriptions
- **trip_members**: Member list updates (RSVP changes, joins, kicks)
- **availabilities**: Calendar heatmap updates (debounced 500ms)
- **poll_votes**: Poll result updates
- **itinerary_items**: Timeline updates

#### Permission Checks
All actions respect role-based permissions:
- **Owner/Co-organizer**: Can manage settings, confirm dates, create polls, kick members, regenerate invite code
- **All Members**: Can vote, add itinerary items, select availability
- **Item Creator**: Can edit/delete own itinerary items

### 4. Key Features

#### Mobile-First Design
- Vertical stacking of all sections
- Touch-optimized buttons
- Responsive grids (3-column on desktop, stack on mobile)
- Overflow scroll for month selectors

#### Thai Language Throughout
All UI text in Thai:
- Status labels: ร่าง, กำลังวางแผน, ยืนยันแล้ว, etc.
- Buttons: เลือกวันที่ตัวเองว่าง, เชิญเพื่อน, สร้างโพลล์
- Empty states with encouraging messages

#### Loading & Empty States
- Skeleton loaders during initial fetch
- Empty state illustrations with CTAs
- No blocking spinners

#### Real-time Collaboration
- All sections update live when other members make changes
- Debounced updates where appropriate (availability)
- Optimistic UI updates

## Usage

```tsx
import { useTripRole } from '@/hooks/useTripRole'

function MyComponent({ tripId }: { tripId: string }) {
  const { isOrganizer, canConfirmDates } = useTripRole(tripId)
  
  return (
    <>
      {isOrganizer && <AdminButton />}
      {canConfirmDates && <ConfirmDateButton />}
    </>
  )
}
```

## Testing Checklist

- [ ] Load trip detail page - all 6 sections render
- [ ] Metric cards show correct data (date mode, budget, invite code)
- [ ] Copy invite code button works
- [ ] Regenerate invite code (organizers only)
- [ ] Member list shows all active members with correct RSVP badges
- [ ] Kick member works (organizers only)
- [ ] Invite modal opens and copy works
- [ ] Availability heatmap shows correct colors
- [ ] Toggle between edit and heatmap mode
- [ ] Select dates in edit mode and save
- [ ] Confirm dates (organizers only) - trip status updates
- [ ] Multi-month selector works
- [ ] Real-time updates when another user:
  - [ ] Joins the trip
  - [ ] Changes RSVP status
  - [ ] Selects availability
  - [ ] Votes on poll
  - [ ] Adds itinerary item
- [ ] Polls section shows all polls
- [ ] Create poll (organizers only)
- [ ] Vote on polls (all vote types: single, multi, ranked)
- [ ] Itinerary section shows timeline
- [ ] Add activity (all members)
- [ ] Confirm activity (organizers only)
- [ ] Delete activity (owner or creator)
- [ ] All permissions work correctly

## Notes

- The page no longer uses tabs - all sections are visible in a single scroll
- All realtime subscriptions clean up properly on unmount
- Permission checks happen at both UI and database (RLS) levels
- The heatmap debounces updates to avoid excessive re-renders
- Toast notifications provide feedback for all user actions
