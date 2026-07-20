# Onboarding Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEW USER FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌──────────┐
│ /register│  User creates account
└─────┬────┘
      │
      ▼
┌─────────────┐
│ Profile     │  profiles table row created
│ Created     │  • id: <uuid>
└─────┬───────┘  • name: "" (empty)
      │          • onboarded_at: NULL
      ▼
┌─────────────┐
│ Try to      │  User clicks "Go to Dashboard"
│ /dashboard  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ (app)       │  Server checks:
│ Layout      │  1. User authenticated? ✅
│ Check       │  2. onboarded_at IS NULL? ✅
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ REDIRECT to │  302 redirect
│ /onboarding │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Onboarding  │  Layout checks:
│ Layout      │  1. User authenticated? ✅
│ Check       │  2. Already onboarded? ❌
└─────┬───────┘
      │
      ▼
┌─────────────────────────────┐
│   Onboarding Page UI        │
│                              │
│  ┌────────────────────────┐ │
│  │   🎉 ยินดีต้อนรับ!     │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │     Avatar Preview      │ │
│  │         (👤)            │ │  Empty at first
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ ชื่อเล่น: [_______]    │ │  User types "แจ๊ค"
│  │           (2/20)        │ │
│  └────────────────────────┘ │
│                              │
│         ⏱️ 300ms delay        │  Debounce
│                              │
│  ┌────────────────────────┐ │
│  │     Avatar Preview      │ │  Avatar updates
│  │   (DiceBear lorelei)   │ │  seed="แจ๊ค"
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ [อัปโหลดรูป (เร็วๆ นี้)]│ │  Disabled
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │   [เริ่มใช้งาน] ✓      │ │  Enabled (valid)
│  └────────────────────────┘ │
└───────────┬─────────────────┘
            │ User clicks submit
            ▼
┌─────────────────────────┐
│ Validation              │  Client-side check:
│ • trim(name) != ""? ✅  │  • Not empty
│ • length >= 2? ✅       │  • Min 2 chars
│ • length <= 20? ✅      │  • Max 20 chars
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Supabase Update         │  UPDATE profiles SET
│ profiles.update()       │  • name = 'แจ๊ค'
│                         │  • onboarded_at = now()
└───────────┬─────────────┘  WHERE id = user.id
            │
            ▼
┌─────────────┐
│ REDIRECT to │  router.push('/dashboard')
│ /dashboard  │  router.refresh()
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ (app)       │  Server checks:
│ Layout      │  1. User authenticated? ✅
│ Check       │  2. onboarded_at IS NULL? ❌
└─────┬───────┘     (now has value!)
      │
      ▼
┌─────────────┐
│ Dashboard   │  ✅ User can access app
│ Page        │  Avatar shows: DiceBear("แจ๊ค")
└─────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      EXISTING USER FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌──────────┐
│  /login  │  User logs in
└─────┬────┘
      │
      ▼
┌─────────────┐
│ Profile     │  profiles table row exists
│ Loaded      │  • id: <uuid>
└─────┬───────┘  • name: "เจมส์" (has name)
      │          • onboarded_at: 2026-01-15 (backfilled)
      ▼
┌─────────────┐
│ Try to      │
│ /dashboard  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ (app)       │  Server checks:
│ Layout      │  1. User authenticated? ✅
│ Check       │  2. onboarded_at IS NULL? ❌
└─────┬───────┘     (has value from backfill)
      │
      ▼
┌─────────────┐
│ Dashboard   │  ✅ Direct access
│ Page        │  No onboarding screen
└─────────────┘  Avatar shows: DiceBear("เจมส์")


┌─────────────────────────────────────────────────────────────────────┐
│                    ALREADY ONBOARDED USER                            │
│              (manually navigates to /onboarding)                     │
└─────────────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌──────────────┐
│ /onboarding  │  User types URL directly
└─────┬────────┘  or clicks old link
      │
      ▼
┌─────────────┐
│ Onboarding  │  Layout checks:
│ Layout      │  1. User authenticated? ✅
│ Check       │  2. Already onboarded? ✅
└─────┬───────┘     (onboarded_at has value)
      │
      ▼
┌─────────────┐
│ REDIRECT to │  Prevent re-onboarding
│ /dashboard  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Dashboard   │  ✅ Protection works
│ Page        │
└─────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT DIAGRAM                           │
└─────────────────────────────────────────────────────────────────┘

middleware.ts
    │
    ├─> Updates Supabase session (cookies)
    │
    ▼

app/(app)/layout.tsx
    │
    ├─> createClient() [server]
    ├─> auth.getUser()
    ├─> profiles.select('onboarded_at')
    │
    ├─> IF !onboarded_at → redirect('/onboarding')
    │
    ▼

app/onboarding/layout.tsx
    │
    ├─> createClient() [server]
    ├─> auth.getUser()
    ├─> profiles.select('onboarded_at')
    │
    ├─> IF onboarded_at → redirect('/dashboard')
    │
    ▼

app/onboarding/page.tsx (Client Component)
    │
    ├─> useState(nickname, error, loading)
    ├─> useEffect(debounce avatar preview, 300ms)
    ├─> createClient() [client]
    │
    ├─> User types → setNickname()
    ├─> Debounce → setDebouncedNickname()
    │
    ├─> UserAvatar(debouncedNickname)
    │       │
    │       └─> https://api.dicebear.com/10.x/lorelei/svg?seed=...
    │
    ├─> User submits → validateNickname()
    ├─> profiles.update({ name, onboarded_at })
    └─> router.push('/dashboard')


components/UserAvatar.tsx
    │
    ├─> Props: { name, size?, className? }
    ├─> Generates URL with seed=name
    ├─> Returns Next.js <Image>
    │       │
    │       └─> src="https://api.dicebear.com/..."
    │           width={size}
    │           height={size}
    │           className="rounded-full"
    └─> Output: Circular avatar image
```

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE FLOW                               │
└─────────────────────────────────────────────────────────────────┘

Migration 034 Applied
    │
    ▼
    
ALTER TABLE profiles
ADD COLUMN onboarded_at timestamptz;

    │
    ▼

Existing Profiles State:
┌─────┬────────┬─────────────┬──────────────┐
│ id  │ name   │ created_at  │ onboarded_at │
├─────┼────────┼─────────────┼──────────────┤
│ u1  │ "เจน"  │ 2026-01-15  │ NULL         │
│ u2  │ "โจ"   │ 2026-02-10  │ NULL         │
│ u3  │ ""     │ 2026-03-01  │ NULL         │
└─────┴────────┴─────────────┴──────────────┘

    │
    ▼

Backfill Runs:
UPDATE profiles
SET onboarded_at = created_at
WHERE name IS NOT NULL 
  AND trim(name) <> '';

    │
    ▼

After Backfill:
┌─────┬────────┬─────────────┬──────────────┐
│ id  │ name   │ created_at  │ onboarded_at │
├─────┼────────┼─────────────┼──────────────┤
│ u1  │ "เจน"  │ 2026-01-15  │ 2026-01-15   │ ✅ Backfilled
│ u2  │ "โจ"   │ 2026-02-10  │ 2026-02-10   │ ✅ Backfilled
│ u3  │ ""     │ 2026-03-01  │ NULL         │ ⚠️ Empty name
└─────┴────────┴─────────────┴──────────────┘

    │
    ▼

New User Registers (u4):
INSERT INTO profiles (id, name, ...)
VALUES ('u4', '', ...);

    │
    ▼

State After New User:
┌─────┬────────┬─────────────┬──────────────┐
│ id  │ name   │ created_at  │ onboarded_at │
├─────┼────────┼─────────────┼──────────────┤
│ u1  │ "เจน"  │ 2026-01-15  │ 2026-01-15   │
│ u2  │ "โจ"   │ 2026-02-10  │ 2026-02-10   │
│ u3  │ ""     │ 2026-03-01  │ NULL         │
│ u4  │ ""     │ 2026-07-20  │ NULL         │ ⚠️ Needs onboarding
└─────┴────────┴─────────────┴──────────────┘

    │
    ▼

User u4 Completes Onboarding:
UPDATE profiles
SET name = 'แจ๊ค',
    onboarded_at = '2026-07-20 18:05:00'
WHERE id = 'u4';

    │
    ▼

Final State:
┌─────┬────────┬─────────────┬───────────────────┐
│ id  │ name   │ created_at  │ onboarded_at      │
├─────┼────────┼─────────────┼───────────────────┤
│ u1  │ "เจน"  │ 2026-01-15  │ 2026-01-15        │
│ u2  │ "โจ"   │ 2026-02-10  │ 2026-02-10        │
│ u3  │ ""     │ 2026-03-01  │ NULL              │
│ u4  │ "แจ๊ค" │ 2026-07-20  │ 2026-07-20 18:05  │ ✅ Onboarded
└─────┴────────┴─────────────┴───────────────────┘

Legend:
  ✅ Can access app
  ⚠️ Will see onboarding screen
```

## Route Protection Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE GUARD DECISION TREE                     │
└─────────────────────────────────────────────────────────────────┘

                        Request to /(app)/* route
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Is user authenticated? │
                    └───────┬────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               YES                     NO
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌──────────────────┐
    │ Load profile        │   │ redirect('/login')│
    │ onboarded_at field  │   └──────────────────┘
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐
    │ Is onboarded_at     │
    │ NULL?               │
    └──────┬──────────────┘
           │
  ┌────────┴────────┐
  │                 │
 YES               NO
  │                 │
  ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ redirect     │  │ Allow access to  │
│ ('/onboarding')│  │ requested route  │
└──────────────┘  └──────────────────┘


                Request to /onboarding route
                           │
                           ▼
              ┌────────────────────────┐
              │ Is user authenticated? │
              └───────┬────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
         YES                     NO
          │                       │
          ▼                       ▼
┌─────────────────────┐   ┌──────────────────┐
│ Load profile        │   │ redirect('/login')│
│ onboarded_at field  │   └──────────────────┘
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Is onboarded_at     │
│ NOT NULL?           │
└──────┬──────────────┘
       │
  ┌────┴────┐
  │         │
 YES       NO
  │         │
  ▼         ▼
┌──────────────┐  ┌──────────────────┐
│ redirect     │  │ Show onboarding  │
│ ('/dashboard')│  │ page form        │
└──────────────┘  └──────────────────┘
```

## Edge Cases Handled

```
┌─────────────────────────────────────────────────────────────────┐
│                         EDGE CASES                               │
└─────────────────────────────────────────────────────────────────┘

1. User with empty name (from old bug/migration)
   ┌─────────────┐
   │ name = ""   │
   │ onboarded_at│ → NULL (not backfilled)
   │ = NULL      │
   └─────┬───────┘
         │
         ▼
   Will see onboarding ✅

2. User manually navigates to /onboarding after completing
   ┌─────────────┐
   │ User types  │
   │ /onboarding │
   │ in browser  │
   └─────┬───────┘
         │
         ▼
   onboarding/layout.tsx checks → redirect to /dashboard ✅

3. User tries to submit invalid name
   ┌─────────────┐
   │ name = "A"  │ → Too short
   └─────┬───────┘
         │
         ▼
   Client validation → Error message shown ✅
   Button stays disabled ✅

4. Network error during profile update
   ┌─────────────┐
   │ Update      │
   │ fails       │
   └─────┬───────┘
         │
         ▼
   Error message → "ไม่สามารถบันทึกข้อมูลได้" ✅
   Loading stops ✅
   User can retry ✅

5. Race condition (multiple tabs)
   Tab 1: Completes onboarding
   Tab 2: Still on onboarding page
   ┌─────────────┐
   │ Tab 2       │
   │ submits     │
   └─────┬───────┘
         │
         ▼
   Profile already has name → Overwrites ✅
   Last write wins (acceptable) ✅

6. User closes browser mid-onboarding
   ┌─────────────┐
   │ Browser     │
   │ closed      │
   └─────┬───────┘
         │
         ▼
   onboarded_at still NULL
   Next login → Back to onboarding ✅
   No data loss ✅
```
