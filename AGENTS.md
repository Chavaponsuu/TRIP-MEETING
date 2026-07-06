# TripMeet — Claude Code Guide

## Project Overview

TripMeet is a full-stack web app for coordinating group trip planning. Friends create trips, mark their available dates on a shared calendar, and the app surfaces the best day when the most people are free.

**Live URL:** https://tripmeet.app  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

---

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check (tsc --noEmit)
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── trips/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Trip detail (tabs)
│   │   │       └── join/page.tsx
│   │   └── layout.tsx          # Auth-protected layout
│   ├── invite/[code]/page.tsx  # Public invite page
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Generic reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   └── Toast.tsx
│   ├── trip/
│   │   ├── TripCard.tsx        # Dashboard trip card
│   │   ├── TripHeader.tsx      # Emoji + name + destination
│   │   ├── EmojiPicker.tsx     # Grid of 16 emoji options
│   │   ├── InviteBox.tsx       # Share URL + copy button
│   │   ├── BestDaysPodium.tsx  # 🥇🥈🥉 top 3 days
│   │   └── CommentThread.tsx   # Realtime comment feed
│   ├── calendar/
│   │   ├── CalendarGrid.tsx    # Shared calendar (edit + heatmap mode)
│   │   ├── CalendarDay.tsx     # Single day cell
│   │   ├── DayTooltip.tsx      # Hover tooltip: who's free
│   │   └── HeatmapLegend.tsx   # Color scale legend
│   └── members/
│       ├── MemberAvatar.tsx    # Initial letter + color circle
│       └── MemberList.tsx      # Member rows with availability summary
├── hooks/
│   ├── useTrip.ts              # Fetch + realtime subscribe for one trip
│   ├── useAvailability.ts      # Read/write user's selected days
│   ├── useComments.ts          # Realtime comment feed
│   └── useAuth.ts              # Current user + session
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client (cookies)
│   │   └── middleware.ts       # Session refresh middleware
│   ├── utils.ts                # cn(), formatDate(), getInitials()
│   └── constants.ts            # EMOJIS[], AVATAR_COLORS[], MONTH_NAMES_TH[]
├── types/
│   └── index.ts                # All shared TypeScript interfaces
└── context/
    └── AuthContext.tsx         # Auth state provider
```

---

## Database Schema

All tables live in Supabase (PostgreSQL). Run these in the Supabase SQL editor.

```sql
-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  avatar_color text default '#5B6FF5',
  created_at timestamptz default now()
);

-- Trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  emoji text default '🗺️',
  description text,
  month int not null check (month between 1 and 12),
  year int not null,
  created_by uuid references profiles(id),
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Trip members
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- Availability (days each user is free)
create table availabilities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  day int not null check (day between 1 and 31),
  unique(trip_id, user_id, day)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);
```

Enable Realtime on `availabilities` and `comments` in Supabase dashboard → Database → Replication.

---

## Row Level Security (RLS)

```sql
-- profiles
alter table profiles enable row level security;
create policy "Own profile" on profiles for all using (auth.uid() = id);

-- trips: only members can view
alter table trips enable row level security;
create policy "Member can view trip" on trips for select
  using (exists (
    select 1 from trip_members
    where trip_id = trips.id and user_id = auth.uid()
  ));
create policy "Creator can update trip" on trips for update
  using (created_by = auth.uid());

-- trip_members
alter table trip_members enable row level security;
create policy "View members of own trip" on trip_members for select
  using (exists (
    select 1 from trip_members tm
    where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()
  ));
create policy "Join trip" on trip_members for insert
  with check (user_id = auth.uid());

-- availabilities
alter table availabilities enable row level security;
create policy "Members read availability" on availabilities for select
  using (exists (
    select 1 from trip_members
    where trip_id = availabilities.trip_id and user_id = auth.uid()
  ));
create policy "Write own availability" on availabilities for all
  using (user_id = auth.uid());

-- comments
alter table comments enable row level security;
create policy "Members read comments" on comments for select
  using (exists (
    select 1 from trip_members
    where trip_id = comments.trip_id and user_id = auth.uid()
  ));
create policy "Write own comments" on comments for insert
  with check (user_id = auth.uid());
```

---

## Key Types (`src/types/index.ts`)

```typescript
export interface Profile {
  id: string
  name: string
  avatar_color: string
  created_at: string
}

export interface Trip {
  id: string
  name: string
  destination: string
  emoji: string
  description?: string
  month: number
  year: number
  created_by: string
  invite_code: string
  created_at: string
  members?: TripMember[]
  availabilities?: Availability[]
  comments?: Comment[]
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  joined_at: string
  user?: Profile
}

export interface Availability {
  id: string
  trip_id: string
  user_id: string
  day: number
  user?: Profile
}

export interface Comment {
  id: string
  trip_id: string
  user_id: string
  text: string
  created_at: string
  user?: Profile
}

export interface DayAvailability {
  day: number
  count: number
  users: Profile[]
}
```

---

## Supabase Client Setup

```typescript
// src/lib/supabase/client.ts  — use in Client Components
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// src/lib/supabase/server.ts  — use in Server Components & Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  )
}
```

---

## Realtime Subscriptions

Set up in `useTrip.ts` — subscribe on mount, unsubscribe on unmount:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`trip-${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'availabilities',
      filter: `trip_id=eq.${tripId}`,
    }, () => refetchAvailabilities())
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `trip_id=eq.${tripId}`,
    }, (payload) => appendComment(payload.new as Comment))
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [tripId])
```

---

## CalendarGrid Component

Used in two modes via the `mode` prop:

| Prop | Type | Description |
|------|------|-------------|
| `trip` | `Trip` | Full trip object with availabilities |
| `mode` | `"edit" \| "heatmap"` | edit = user selects days · heatmap = read-only color view |
| `selectedDays` | `Set<number>` | (edit mode) currently selected days |
| `onToggleDay` | `(day: number) => void` | (edit mode) called when a day is clicked |

Heatmap color logic:

```typescript
const getHeatLevel = (count: number, total: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0
  const ratio = count / total
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5)  return 2
  if (ratio <= 0.75) return 3
  return 4
}

// Tailwind classes per level:
// 0 → bg-white
// 1 → bg-indigo-100
// 2 → bg-indigo-200
// 3 → bg-indigo-400
// 4 → bg-indigo-600 text-white
```

---

## Constants (`src/lib/constants.ts`)

```typescript
export const TRIP_EMOJIS = [
  '🏖️','🏔️','🌴','🗺️','✈️','🚗','🏕️','🌊',
  '🗼','🎡','🍜','🎭','🌅','🏝️','🎿','🚢'
]

export const AVATAR_COLORS = [
  '#E07B54','#5B8DEF','#6CC47A',
  '#B07FE8','#E8A838','#4EC9C9'
]

export const MONTH_NAMES_TH = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
  'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
  'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
]

export const DAY_NAMES_TH = ['อา','จ','อ','พ','พฤ','ศ','ส']
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Design Tokens

| Token | Value |
|-------|-------|
| Primary | `#5B6FF5` |
| Primary hover | `#4A5DE0` |
| Background | `#F8F9FF` |
| Card background | `#FFFFFF` |
| Border | `#E5E7EB` |
| Text primary | `#111827` |
| Text secondary | `#6B7280` |
| Border radius (card) | `12px` |
| Border radius (button/input) | `8px` |
| Transition | `150ms ease` |

All UI text inside the app is in **Thai language**.
Design is **mobile-first** — primary device is a phone.

---

## Coding Conventions

- **Components:** PascalCase filenames, named exports — `export function TripCard()`
- **Hooks:** camelCase with `use` prefix — `useTrip.ts`, `useAuth.ts`
- **Server vs Client:** Default to Server Components. Add `'use client'` only when using hooks, events, or browser APIs
- **Data fetching:** Server Components fetch via `supabase/server`. Client Components use custom hooks
- **Error handling:** Always destructure `{ data, error }` from Supabase calls and handle error explicitly
- **Forms:** Use controlled inputs with `useState`, not `useRef` or `FormData`
- **Tailwind:** Avoid inline `style={}` except for truly dynamic values (e.g. avatar color). Use `cn()` from `lib/utils` for conditional classes

---

## Common Patterns

**Protecting a page (Server Component):**
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
}
```

**Joining a trip by invite code:**
```typescript
const { data: trip } = await supabase
  .from('trips')
  .select('id, name, emoji')
  .eq('invite_code', code)
  .single()

await supabase.from('trip_members').insert({
  trip_id: trip.id,
  user_id: user.id,
})
```

**Saving availability (replace strategy):**
```typescript
// Delete all existing days for this user+trip, then re-insert
await supabase.from('availabilities')
  .delete()
  .eq('trip_id', tripId)
  .eq('user_id', userId)

await supabase.from('availabilities')
  .insert(selectedDays.map(day => ({ trip_id: tripId, user_id: userId, day })))
```

---

## Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Email/password + Google OAuth |
| `/register` | Public | Sign up + create profile |
| `/dashboard` | Protected | All user's trips |
| `/trips/new` | Protected | Create trip form |
| `/trips/[id]` | Protected | Trip detail (4 tabs) |
| `/trips/[id]/join` | Protected | Join confirmation |
| `/invite/[code]` | Public | Join via invite link |

---

## Suggested Build Order

1. Supabase setup — schema + RLS + enable Realtime
2. Auth — `/login`, `/register`, profile creation on first sign-up
3. Dashboard — trip list + `TripCard`
4. Create trip — `/trips/new` + `EmojiPicker`
5. `CalendarGrid` in edit mode + availability save/load
6. `CalendarGrid` in heatmap mode + `BestDaysPodium`
7. Members tab + `MemberList`
8. Comments + Realtime subscription
9. Invite system — `InviteBox` + `/invite/[code]`
10. Landing page
11. Polish — loading skeletons, empty states, error states, mobile layout