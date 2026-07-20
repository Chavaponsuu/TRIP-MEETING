# Design Document: Onboarding Nickname Avatar

## Overview

This feature introduces a post-authentication onboarding flow that guides users through setting their nickname and generating a personalized avatar using the DiceBear library. The system intercepts dashboard access for users who haven't completed onboarding, redirecting them to a dedicated onboarding page where they can enter their nickname and see a real-time preview of their generated avatar.

## Architecture

### Component Structure

```
src/
├── app/
│   └── (app)/
│       └── onboarding/
│           └── page.tsx              # Onboarding page (Client Component)
├── components/
│   └── user/
│       └── UserAvatar.tsx            # New DiceBear avatar component
├── lib/
│   ├── supabase/
│   │   └── middleware.ts             # Enhanced with onboarding check
│   └── avatar.ts                     # DiceBear generation utilities
└── types/
    └── index.ts                      # Extended Profile interface
```

### Data Flow

1. **Authentication → Onboarding Check (Middleware)**
   - User authenticates via `/login` or `/register`
   - Middleware intercepts navigation to protected routes
   - Checks `Profile.onboarded_at` field
   - If null → redirect to `/onboarding`
   - If not null → allow access to requested route

2. **Onboarding Form Interaction**
   - User types nickname → real-time avatar preview updates
   - Form validation runs on submit
   - Valid submission → save to database → redirect to dashboard
   - Invalid submission → display Thai error message

3. **Avatar Display Throughout App**
   - `UserAvatar` component reads `Profile.name` and `Profile.avatar_style`
   - Generates DiceBear SVG using stored seed and style
   - Renders in various sizes (sm/md/lg)

## Database Schema Extensions

### Updated Profile Table


```sql
-- Add new columns to existing profiles table
ALTER TABLE profiles 
  ADD COLUMN onboarded_at timestamptz DEFAULT NULL,
  ADD COLUMN avatar_style text DEFAULT 'lorelei';

-- Migration script: 000XXX_add_onboarding_fields.up.sql
```

### Migration File

**File:** `migrations/000XXX_add_onboarding_fields.up.sql`
```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS avatar_style text DEFAULT 'lorelei';
```

**File:** `migrations/000XXX_add_onboarding_fields.down.sql`
```sql
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS onboarded_at,
  DROP COLUMN IF EXISTS avatar_style;
```

### TypeScript Interface Extension

```typescript
// src/types/index.ts - Updated Profile interface
export interface Profile {
  id: string
  name: string
  avatar_color: string | null
  onboarded_at: string | null      // NEW: ISO timestamp or null
  avatar_style: string              // NEW: DiceBear style identifier
  created_at: string
}
```

## Component Designs

### 1. Onboarding Page (`src/app/(app)/onboarding/page.tsx`)

**Component Type:** Client Component (`'use client'`)

**State Management:**
```typescript
const [nickname, setNickname] = useState<string>('')
const [error, setError] = useState<string>('')
const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
```


**UI Structure:**
```tsx
<div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-4">
  <Card className="w-full max-w-md p-8">
    <h1 className="text-2xl font-bold text-center mb-2">สร้างโปรไฟล์</h1>
    <p className="text-gray-600 text-center mb-8">เลือกชื่อเล่นของคุณ</p>
    
    {/* Avatar Preview - 96x96 minimum */}
    <div className="flex justify-center mb-6">
      <AvatarPreview seed={nickname || 'placeholder'} size={96} />
    </div>
    
    {/* Nickname Input */}
    <Input
      label="ชื่อเล่น"
      value={nickname}
      onChange={(e) => setNickname(e.target.value)}
      placeholder="กรอกชื่อเล่นของคุณ"
      error={error}
      maxLength={50}
    />
    
    {/* Submit Button */}
    <Button
      onClick={handleSubmit}
      disabled={isSubmitting}
      className="w-full mt-6"
    >
      {isSubmitting ? 'กำลังบันทึก...' : 'ดำเนินการต่อ'}
    </Button>
  </Card>
</div>
```

**Validation Logic:**
```typescript
function validateNickname(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return 'กรุณากรอกชื่อเล่น'
  }
  if (trimmed.length > 50) {
    return 'ชื่อเล่นต้องไม่เกิน 50 ตัวอักษร'
  }
  return null
}
```

**Submit Handler:**
```typescript
async function handleSubmit() {
  const validationError = validateNickname(nickname)
  if (validationError) {
    setError(validationError)
    return
  }

  setIsSubmitting(true)
  setError('')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    setError('ไม่พบข้อมูลผู้ใช้')
    setIsSubmitting(false)
    return
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      name: nickname.trim(),
      avatar_style: 'lorelei',
      onboarded_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    setIsSubmitting(false)
    return
  }

  router.push('/dashboard')
}
```

**Initial Data Loading (for existing users):**
```typescript
useEffect(() => {
  async function loadExistingProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    if (profile?.name) {
      setNickname(profile.name)
    }
  }

  loadExistingProfile()
}, [])
```


### 2. UserAvatar Component (`src/components/user/UserAvatar.tsx`)

**Component Type:** Client Component (uses DiceBear client-side rendering)

**Props Interface:**
```typescript
interface UserAvatarProps {
  profile: Profile
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**Size Mapping:**
```typescript
const sizeMap = {
  sm: 32,  // 32x32px
  md: 48,  // 48x48px
  lg: 96   // 96x96px
} as const
```

**Implementation:**
```typescript
'use client'

import { createAvatar } from '@dicebear/core'
import { lorelei } from '@dicebear/lorelei'
import type { Profile } from '@/types'

export function UserAvatar({ 
  profile, 
  size = 'md',
  className = ''
}: UserAvatarProps) {
  const pixelSize = sizeMap[size]
  
  // Determine avatar style (with fallback)
  const avatarStyle = profile.avatar_style || 'lorelei'
  
  // Use profile name as seed, or fallback for empty names
  const seed = profile.name?.trim() || `fallback-${profile.id}`
  
  // Generate avatar SVG
  const avatar = useMemo(() => {
    if (avatarStyle === 'lorelei') {
      return createAvatar(lorelei, {
        seed,
        size: pixelSize,
      }).toString()
    }
    // Future: support other styles
    // For now, default to lorelei
    return createAvatar(lorelei, {
      seed,
      size: pixelSize,
    }).toString()
  }, [seed, pixelSize, avatarStyle])

  return (
    <div 
      className={`rounded-full overflow-hidden ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      dangerouslySetInnerHTML={{ __html: avatar }}
    />
  )
}
```

**Alternative Implementation (using img tag):**
```typescript
export function UserAvatar({ profile, size = 'md', className = '' }: UserAvatarProps) {
  const pixelSize = sizeMap[size]
  const seed = profile.name?.trim() || `fallback-${profile.id}`
  const avatarStyle = profile.avatar_style || 'lorelei'
  
  const avatarDataUrl = useMemo(() => {
    const svg = createAvatar(lorelei, { seed, size: pixelSize }).toString()
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }, [seed, pixelSize])

  return (
    <img
      src={avatarDataUrl}
      alt={`${profile.name || 'User'} avatar`}
      className={`rounded-full ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    />
  )
}
```


### 3. Avatar Generation Utility (`src/lib/avatar.ts`)

**Purpose:** Centralized DiceBear generation logic for reuse across components

```typescript
import { createAvatar } from '@dicebear/core'
import { lorelei } from '@dicebear/lorelei'

type AvatarStyle = 'lorelei' // Extensible for future styles

const styleLibraries = {
  lorelei: lorelei,
  // Future: add more styles
}

export interface GenerateAvatarOptions {
  seed: string
  style?: AvatarStyle
  size?: number
}

/**
 * Generates a DiceBear avatar SVG string
 * @param options - Generation options
 * @returns SVG string
 */
export function generateAvatar({
  seed,
  style = 'lorelei',
  size = 48
}: GenerateAvatarOptions): string {
  const styleLibrary = styleLibraries[style] || styleLibraries.lorelei
  
  return createAvatar(styleLibrary, {
    seed,
    size,
  }).toString()
}

/**
 * Generates a data URL for use in img src
 * @param options - Generation options
 * @returns Data URL string
 */
export function generateAvatarDataUrl(options: GenerateAvatarOptions): string {
  const svg = generateAvatar(options)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Gets the appropriate seed from a profile, with fallback
 * @param profile - User profile
 * @returns Seed string for avatar generation
 */
export function getAvatarSeed(profile: { id: string; name?: string | null }): string {
  return profile.name?.trim() || `fallback-${profile.id}`
}
```


### 4. Middleware Enhancement (`src/lib/supabase/middleware.ts`)

**Enhanced Onboarding Check:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/trips', '/friends']
  const isProtectedRoute = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check onboarding status
  if (user && isProtectedRoute) {
    // Skip onboarding check if already on onboarding page
    if (request.nextUrl.pathname === '/onboarding') {
      return supabaseResponse
    }

    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .single()

    // If onboarding not completed, redirect to onboarding
    if (profile && profile.onboarded_at === null) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
```


## Integration Points

### 1. Registration Flow Integration

**File:** `src/app/(auth)/register/page.tsx`

**No changes required** - Profile creation already happens via database trigger. The new `onboarded_at` and `avatar_style` columns will use their default values (null and 'lorelei' respectively).

**Database Trigger (existing):**
```sql
-- This trigger already exists and doesn't need modification
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

The trigger creates a profile with default values. The new columns will automatically use their defaults:
- `onboarded_at`: NULL (triggers onboarding flow)
- `avatar_style`: 'lorelei' (used if user completes onboarding)

### 2. Dashboard Access Point

**File:** `src/app/(app)/dashboard/page.tsx`

No code changes needed - middleware handles the redirect transparently. The dashboard page remains a server component with standard protection:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Middleware ensures we only reach here if onboarded_at is not null
  // ... rest of dashboard logic
}
```

### 3. MemberAvatar Preservation

**File:** `src/components/members/MemberAvatar.tsx`

**Status:** NO CHANGES in MVP

The existing MemberAvatar component will continue to function as-is, showing initial-letter avatars with colored backgrounds. Migration to UserAvatar will be handled in a future release.

```typescript
// This component remains unchanged
export function MemberAvatar({ profile, size = 'md' }: MemberAvatarProps) {
  const initials = getInitials(profile.name)
  const bgColor = profile.avatar_color || '#5B6FF5'
  
  return (
    <div 
      className="rounded-full flex items-center justify-center"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  )
}
```


## Error Handling

### Client-Side Validation Errors

**Scenario:** User submits invalid nickname
- **Detection:** `validateNickname()` function
- **Display:** Error message in Thai below input field
- **Recovery:** User corrects input and resubmits

```typescript
// Error states
const errorMessages = {
  empty: 'กรุณากรอกชื่อเล่น',
  tooLong: 'ชื่อเล่นต้องไม่เกิน 50 ตัวอักษร',
}
```

### Database Save Errors

**Scenario:** Supabase update fails (network, permissions, etc.)
- **Detection:** `error` returned from `.update()` call
- **Display:** Generic Thai error message with retry option
- **Recovery:** User clicks submit again to retry

```typescript
if (updateError) {
  setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
  setIsSubmitting(false)
  return
}
```

### Missing Authentication

**Scenario:** User session expires during onboarding
- **Detection:** `user` is null from `getUser()` call
- **Display:** Authentication error message
- **Recovery:** Redirect to login page

```typescript
if (!user) {
  router.push('/login')
  return
}
```

### Avatar Generation Errors

**Scenario:** DiceBear library fails to generate avatar
- **Fallback:** Use profile ID as seed to ensure deterministic fallback
- **No user-facing error:** Graceful degradation

```typescript
const seed = profile.name?.trim() || `fallback-${profile.id}`
```


## Dependencies

### NPM Packages (to be installed)

```json
{
  "dependencies": {
    "@dicebear/core": "^9.0.0",
    "@dicebear/lorelei": "^9.0.0"
  }
}
```

**Installation command:**
```bash
npm install @dicebear/core @dicebear/lorelei
```

### Existing Dependencies (already in project)

- `@supabase/ssr` - Server-side Supabase client
- `next` - App Router and middleware
- `react` - Component framework
- `tailwindcss` - Styling

## Security Considerations

### 1. Server-Side Onboarding Check

The onboarding status check MUST happen in middleware (server-side) to prevent bypassing via client-side manipulation:

```typescript
// ✅ CORRECT: Server-side check in middleware
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarded_at')
  .eq('id', user.id)
  .single()
```

```typescript
// ❌ WRONG: Client-side check can be bypassed
// Never check onboarding status only on the client
```

### 2. Row Level Security (RLS)

Existing RLS policies already protect profile updates:

```sql
-- Already exists in database
create policy "Own profile" on profiles 
  for all using (auth.uid() = id);
```

This ensures users can only update their own profile, including `onboarded_at`, `name`, and `avatar_style` fields.

### 3. Input Sanitization

- **Nickname input:** No special sanitization needed - stored as plain text
- **SQL injection:** Protected by Supabase's parameterized queries
- **XSS in avatar:** DiceBear generates clean SVG, but still use `dangerouslySetInnerHTML` carefully or prefer `img` tag approach


## User Experience Flow

### New User Journey

1. User clicks "Register" on landing page
2. Fills registration form (email, password)
3. Submits form → Auth creates account
4. Database trigger creates profile with `onboarded_at = null`
5. App redirects to `/dashboard`
6. Middleware intercepts → detects `onboarded_at = null`
7. **Middleware redirects to `/onboarding`**
8. User sees onboarding page with:
   - Centered card
   - Thai text: "สร้างโปรไฟล์"
   - Empty nickname input
   - Placeholder avatar
9. User types nickname → avatar preview updates in real-time
10. User clicks "ดำเนินการต่อ" button
11. System saves nickname, avatar_style, and onboarded_at timestamp
12. **App redirects to `/dashboard`**
13. User now has full access to the app

### Existing User Journey (with null onboarded_at)

1. User logs in with existing credentials
2. App attempts to redirect to `/dashboard`
3. Middleware intercepts → detects `onboarded_at = null`
4. **Middleware redirects to `/onboarding`**
5. User sees onboarding page with:
   - Their existing name pre-filled in input (if they have one)
   - Avatar preview generated from existing name
   - Can edit or keep existing name
6. User submits (same process as new user)
7. **App redirects to `/dashboard`**
8. User continues with updated profile

### Returning User Journey (with onboarded_at set)

1. User logs in
2. App redirects to `/dashboard`
3. Middleware checks onboarding status → `onboarded_at` is not null
4. **User proceeds directly to dashboard** (no interruption)
5. User sees their DiceBear avatar throughout the app (via UserAvatar component)


## Mobile-First Design Specifications

### Onboarding Page Layout

**Mobile (< 640px):**
```css
.onboarding-container {
  padding: 1rem;              /* 16px spacing from edges */
  min-height: 100vh;          /* Full viewport height */
  display: flex;
  align-items: center;        /* Vertical center */
  justify-content: center;    /* Horizontal center */
}

.onboarding-card {
  width: 100%;                /* Full width minus padding */
  max-width: 28rem;           /* 448px max */
  padding: 2rem;              /* 32px internal padding */
  border-radius: 12px;        /* Card border radius */
}

.avatar-preview {
  width: 96px;
  height: 96px;
  margin: 0 auto 1.5rem;      /* Centered with bottom margin */
}

.nickname-input {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  padding: 0 1rem;
  font-size: 16px;            /* Prevent iOS zoom on focus */
}

.submit-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  margin-top: 1.5rem;
}
```

**Tablet/Desktop (≥ 640px):**
- Same layout, card is constrained to `max-width: 28rem`
- More generous whitespace around card

### UserAvatar Component Sizes

```typescript
const sizeMap = {
  sm: 32,  // Use in: comment threads, small lists
  md: 48,  // Use in: member lists, trip cards (default)
  lg: 96   // Use in: profile pages, onboarding preview
}
```

### Design Tokens (TripMeet)

```typescript
// Colors
const colors = {
  primary: '#5B6FF5',
  primaryHover: '#4A5DE0',
  background: '#F8F9FF',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
}

// Border Radius
const borderRadius = {
  card: '12px',
  button: '8px',
  input: '8px',
  avatar: '9999px',  // Fully rounded circle
}

// Transitions
const transition = '150ms ease'
```


## Future Extensibility

### Supporting Multiple Avatar Styles

The design includes `avatar_style` column to support future expansion without database migrations:

**Current (MVP):**
```typescript
// Only lorelei style supported
const styleLibraries = {
  lorelei: lorelei,
}
```

**Future Enhancement:**
```typescript
import { lorelei } from '@dicebear/lorelei'
import { avataaars } from '@dicebear/avataaars'
import { bottts } from '@dicebear/bottts'

const styleLibraries = {
  lorelei: lorelei,
  avataaars: avataaars,
  bottts: bottts,
}

// Add style selector UI to onboarding or profile settings
<StylePicker 
  value={selectedStyle}
  onChange={setSelectedStyle}
  options={['lorelei', 'avataaars', 'bottts']}
/>
```

**Profile Update:**
```typescript
await supabase
  .from('profiles')
  .update({
    name: nickname,
    avatar_style: selectedStyle,  // User-selected style
    onboarded_at: new Date().toISOString()
  })
  .eq('id', user.id)
```

### Migrating from MemberAvatar to UserAvatar

**Phase 1 (MVP):** UserAvatar exists but isn't used in trip features
**Phase 2 (Future):** Gradually replace MemberAvatar usage:

```typescript
// Before (using MemberAvatar)
<MemberAvatar profile={member.user} size="md" />

// After (using UserAvatar)
<UserAvatar profile={member.user} size="md" />
```

**Migration checklist for Phase 2:**
- [ ] Replace in trip member lists
- [ ] Replace in comment threads
- [ ] Replace in invitation cards
- [ ] Replace in friend lists
- [ ] Remove MemberAvatar component
- [ ] Remove unused `avatar_color` column (optional)


## Testing Strategy

### Unit Tests

**1. Validation Logic (`validateNickname`)**
- Test with empty string → expect error
- Test with whitespace-only string → expect error
- Test with 1 character → expect pass
- Test with 50 characters → expect pass
- Test with 51 characters → expect error

**2. Avatar Generation (`generateAvatar`)**
- Test with valid seed → expect SVG string
- Test with empty seed → expect fallback SVG
- Test same seed twice → expect identical output (determinism)
- Test different seeds → expect different output

**3. UserAvatar Component Rendering**
- Test with sm size → expect 32x32 dimensions
- Test with md size → expect 48x48 dimensions
- Test with lg size → expect 96x96 dimensions
- Test with profile.name → expect avatar from name seed
- Test with null profile.name → expect fallback avatar

### Integration Tests

**1. Middleware Onboarding Check**
- Test with onboarded_at = null → expect redirect to /onboarding
- Test with onboarded_at = timestamp → expect no redirect
- Test unauthenticated request → expect redirect to /login

**2. Onboarding Form Submission**
- Test valid submission → expect profile update and redirect to /dashboard
- Test database error → expect error message display
- Test session expiration → expect redirect to /login

**3. Profile Pre-fill for Existing Users**
- Test existing user with name → expect input field pre-filled
- Test existing user with name → expect avatar preview on load
- Test new user → expect empty input and placeholder avatar

### Property-Based Tests

Property-based testing is not extensively used in this feature due to the nature of the requirements (mostly UI/integration focused). However, a few properties can be tested:


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Onboarding Completion Timestamp

*For any* valid nickname input submitted through the onboarding form, the system SHALL set the `Profile.onboarded_at` field to a non-null timestamp value.

**Validates: Requirements 2.3**

### Property 2: Avatar Style Persistence

*For any* avatar style string value, when stored in `Profile.avatar_style`, the system SHALL retrieve the exact same value when queried.

**Validates: Requirements 2.4**

### Property 3: Nickname Length Validation

*For any* string input to the nickname field, validation SHALL pass if and only if the trimmed length is between 1 and 50 characters (inclusive).

**Validates: Requirements 3.2, 3.3**

### Property 4: Nickname Persistence and Replacement

*For any* valid nickname and any existing `Profile.name` value (including null), submitting the onboarding form SHALL replace the `Profile.name` field with the new nickname value.

**Validates: Requirements 3.4**

### Property 5: Validation Error Display

*For any* invalid nickname input (length 0 or > 50 characters), the onboarding form SHALL display an error message in Thai language and prevent form submission.

**Validates: Requirements 3.5**

### Property 6: Real-Time Avatar Preview Update

*For any* string typed into the nickname field, the avatar preview SHALL update in real-time to display an avatar generated from that string as the seed.

**Validates: Requirements 4.1, 4.3**


### Property 7: Deterministic Avatar Generation

*For any* given nickname string used as a seed, generating a DiceBear avatar multiple times SHALL produce identical output (SVG string) each time.

**Validates: Requirements 4.2**

### Property 8: UserAvatar Component Generation

*For any* Profile object with a non-null, non-empty `name` field, the UserAvatar component SHALL generate and display a DiceBear avatar using that name as the seed.

**Validates: Requirements 6.3**

### Property 9: Existing Profile Name Pre-fill

*For any* existing Profile with a non-null, non-empty `name` value, when the onboarding page loads, the nickname input field SHALL be pre-filled with that name value.

**Validates: Requirements 10.4**

### Property 10: Initial Avatar Preview from Existing Name

*For any* existing Profile with a non-null, non-empty `name` value, when the onboarding page loads, the avatar preview SHALL display an avatar generated from that name value as the seed.

**Validates: Requirements 10.5**

### Property 11: Avatar Style Selection

*For any* valid avatar style identifier stored in `Profile.avatar_style`, the UserAvatar component SHALL use that style to generate the avatar.

**Validates: Requirements 12.3, 12.4**

### Property 12: Avatar Style Fallback

*For any* Profile where `avatar_style` is null, the UserAvatar component SHALL default to using the "lorelei" style for avatar generation.

**Validates: Requirements 12.5**


## Implementation Checklist

### Phase 1: Database & Dependencies

- [ ] Install DiceBear packages: `npm install @dicebear/core @dicebear/lorelei`
- [ ] Create migration file: `000XXX_add_onboarding_fields.up.sql`
- [ ] Create migration file: `000XXX_add_onboarding_fields.down.sql`
- [ ] Run migration: `npm run migrate` (or Supabase dashboard)
- [ ] Update TypeScript `Profile` interface with new fields
- [ ] Verify existing profile trigger doesn't need changes

### Phase 2: Core Components

- [ ] Create `src/lib/avatar.ts` with DiceBear utilities
- [ ] Create `src/components/user/UserAvatar.tsx` component
- [ ] Write unit tests for `UserAvatar` component
- [ ] Create `src/app/(app)/onboarding/page.tsx` page
- [ ] Implement nickname validation logic
- [ ] Implement real-time avatar preview
- [ ] Implement form submission handler
- [ ] Write tests for validation logic

### Phase 3: Middleware Integration

- [ ] Update `src/lib/supabase/middleware.ts` with onboarding check
- [ ] Test middleware redirects for null `onboarded_at`
- [ ] Test middleware allows access for non-null `onboarded_at`
- [ ] Test middleware doesn't redirect on `/onboarding` page itself

### Phase 4: Thai Language Text

- [ ] Add Thai text to onboarding page title
- [ ] Add Thai text to onboarding page subtitle
- [ ] Add Thai text to input label and placeholder
- [ ] Add Thai text to submit button
- [ ] Add Thai error messages for validation
- [ ] Add Thai error messages for save failures

### Phase 5: Styling & Mobile Design

- [ ] Apply TripMeet design tokens to onboarding page
- [ ] Ensure mobile-first responsive layout
- [ ] Test on mobile viewport (375px width)
- [ ] Verify avatar preview is 96x96 minimum
- [ ] Verify form is centered vertically and horizontally
- [ ] Test loading state during submission

### Phase 6: Integration & E2E Testing

- [ ] Test new user registration → onboarding flow
- [ ] Test existing user login → onboarding flow (if needed)
- [ ] Test existing user with `onboarded_at` → skip onboarding
- [ ] Test form submission success → dashboard redirect
- [ ] Test form submission error → retry capability
- [ ] Test existing name pre-fill for existing users

### Phase 7: Documentation

- [ ] Update project README with onboarding flow
- [ ] Update AGENTS.md with new routes and components
- [ ] Document DiceBear dependency usage
- [ ] Document avatar style extensibility approach


## Code Examples

### Example 1: Using UserAvatar in a Component

```tsx
import { UserAvatar } from '@/components/user/UserAvatar'
import type { Profile } from '@/types'

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3">
      <UserAvatar 
        profile={comment.user} 
        size="sm" 
      />
      <div>
        <p className="font-semibold">{comment.user.name}</p>
        <p className="text-gray-600">{comment.text}</p>
      </div>
    </div>
  )
}
```

### Example 2: Onboarding Page Protection (Server Component)

```tsx
// src/app/(app)/onboarding/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at, name')
    .eq('id', user.id)
    .single()

  // If already onboarded, redirect to dashboard
  if (profile?.onboarded_at) {
    redirect('/dashboard')
  }

  return <OnboardingForm existingName={profile?.name} />
}
```

### Example 3: Avatar Generation Utility Usage

```tsx
import { generateAvatar, generateAvatarDataUrl, getAvatarSeed } from '@/lib/avatar'

// Generate SVG string
const svgString = generateAvatar({
  seed: 'สมชาย',
  style: 'lorelei',
  size: 48
})

// Generate data URL for img src
const dataUrl = generateAvatarDataUrl({
  seed: 'สมชาย',
  size: 96
})

// Get seed from profile with fallback
const seed = getAvatarSeed(profile)
```

### Example 4: Custom Hook for Profile Loading (Optional)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useCurrentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [])

  return { profile, loading }
}
```


## Performance Considerations

### Avatar Generation Performance

**Issue:** Generating DiceBear avatars on every render could impact performance in lists with many avatars.

**Solution 1: Memoization**
```tsx
const avatar = useMemo(() => {
  return generateAvatar({ seed, size: pixelSize, style: avatarStyle })
}, [seed, pixelSize, avatarStyle])
```

**Solution 2: Server-Side Generation (Future Enhancement)**
```tsx
// Generate avatar on server and cache
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seed = searchParams.get('seed')
  const size = parseInt(searchParams.get('size') || '48')
  
  const svg = generateAvatar({ seed, size })
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}

// Usage
<img src={`/api/avatar?seed=${encodeURIComponent(profile.name)}&size=48`} />
```

### Middleware Performance

**Issue:** Middleware runs on every request, including static assets.

**Current Mitigation:**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

This ensures middleware only runs for page routes, not static assets.

**Database Query Optimization:**
```typescript
// Only select needed field
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarded_at')  // Don't select unnecessary fields
  .eq('id', user.id)
  .single()
```

### Real-Time Avatar Preview

**Issue:** Updating avatar on every keystroke could cause performance issues.

**Solution: Debouncing (if needed)**
```tsx
import { useDebouncedValue } from '@/hooks/useDebounce'

const debouncedNickname = useDebouncedValue(nickname, 150)

// Use debounced value for avatar generation
<AvatarPreview seed={debouncedNickname || 'placeholder'} />
```

**Note:** Initial implementation doesn't need debouncing since DiceBear generation is fast. Add only if performance issues are observed.


## Accessibility Considerations

### Avatar Component

```tsx
// Include alt text for screen readers
<img
  src={avatarDataUrl}
  alt={`${profile.name || 'ผู้ใช้'} avatar`}
  className="rounded-full"
  role="img"
/>

// Or for inline SVG
<div 
  className="rounded-full"
  role="img"
  aria-label={`${profile.name || 'ผู้ใช้'} avatar`}
  dangerouslySetInnerHTML={{ __html: avatar }}
/>
```

### Onboarding Form

```tsx
// Proper label association
<label htmlFor="nickname-input" className="block text-sm font-medium mb-2">
  ชื่อเล่น
</label>
<input
  id="nickname-input"
  type="text"
  value={nickname}
  onChange={(e) => setNickname(e.target.value)}
  aria-invalid={error ? 'true' : 'false'}
  aria-describedby={error ? 'nickname-error' : undefined}
/>

// Error message with proper ARIA
{error && (
  <p id="nickname-error" className="text-red-500 text-sm mt-1" role="alert">
    {error}
  </p>
)}

// Button with loading state
<button
  onClick={handleSubmit}
  disabled={isSubmitting}
  aria-busy={isSubmitting}
>
  {isSubmitting ? 'กำลังบันทึก...' : 'ดำเนินการต่อ'}
</button>
```

### Keyboard Navigation

- Input field should be auto-focused on page load
- Enter key should submit form (native form behavior)
- Tab navigation should work naturally through form elements

```tsx
useEffect(() => {
  inputRef.current?.focus()
}, [])
```

### Color Contrast

All text must meet WCAG AA standards:
- Primary text (#111827) on white background ✅ (contrast ratio: 16.1:1)
- Secondary text (#6B7280) on white background ✅ (contrast ratio: 5.7:1)
- Error text (red-500) on white background ✅ (contrast ratio: 4.5:1+)


## Edge Cases

### 1. User Leaves Onboarding Page

**Scenario:** User navigates away from `/onboarding` before completing it.

**Behavior:** 
- Middleware will redirect them back to `/onboarding` on next protected route access
- Partial input is lost (form state is not persisted)
- This is acceptable behavior - user must complete onboarding to continue

### 2. User Has Extremely Long Existing Name

**Scenario:** Existing user has a name longer than 50 characters (shouldn't happen, but data could be corrupted).

**Behavior:**
- Pre-fill with existing name
- Validation will fail on submit
- User must edit to ≤ 50 characters
- Error message guides user to correct it

### 3. Multiple Tabs/Windows

**Scenario:** User has multiple tabs open and completes onboarding in one.

**Behavior:**
- Tab 1: Completes onboarding, sets `onboarded_at`
- Tab 2: Still shows onboarding form
- Tab 2 submit: Works fine, updates profile again (idempotent)
- Tab 2 navigation: Middleware sees `onboarded_at` is set, allows access

### 4. Profile Creation Failure

**Scenario:** Database trigger fails to create profile after registration.

**Behavior:**
- User authenticates but has no profile row
- Middleware query returns null
- Should redirect to error page (implementation note: add error handling)

```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('onboarded_at')
  .eq('id', user.id)
  .single()

if (error || !profile) {
  // Handle missing profile
  const url = request.nextUrl.clone()
  url.pathname = '/error'
  url.searchParams.set('message', 'profile_not_found')
  return NextResponse.redirect(url)
}
```

### 5. Unicode and Emoji in Nicknames

**Scenario:** User enters emoji or special Unicode characters.

**Behavior:**
- PostgreSQL text column supports Unicode ✅
- DiceBear accepts Unicode seeds ✅
- Character count is based on JavaScript `.length` (may count some emoji as 2)
- This is acceptable - validation is permissive

### 6. Onboarded User Accessing /onboarding Directly

**Scenario:** User with `onboarded_at` set types `/onboarding` in URL.

**Behavior:**
- Server component checks `onboarded_at`
- If set, redirects to `/dashboard`
- User cannot access onboarding page after completion

```tsx
// In onboarding page.tsx
if (profile?.onboarded_at) {
  redirect('/dashboard')
}
```


## Rollback Plan

### If Issues Arise Post-Deployment

**Step 1: Temporarily Disable Onboarding Requirement**

```typescript
// In middleware.ts - add feature flag check
const ONBOARDING_ENABLED = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === 'true'

if (user && isProtectedRoute && ONBOARDING_ENABLED) {
  // ... onboarding check logic
}
```

**Step 2: Database Rollback (if needed)**

```sql
-- Run the down migration
ALTER TABLE profiles 
  DROP COLUMN IF EXISTS onboarded_at,
  DROP COLUMN IF EXISTS avatar_style;
```

**Step 3: Code Rollback**

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Or temporarily disable via environment variable
NEXT_PUBLIC_ONBOARDING_ENABLED=false
```

### Backward Compatibility

**Existing Users:**
- Users with null `onboarded_at` will be prompted to onboard
- This is the intended behavior (feature adoption)
- No data loss - existing `name` and `avatar_color` fields remain

**MemberAvatar Preservation:**
- Trip member displays continue working unchanged
- No visual regression for users who haven't seen the new feature

**Database Schema:**
- New columns have default values
- Existing queries not using new columns are unaffected
- Adding columns doesn't break existing code


## Summary

This design introduces a post-authentication onboarding flow for TripMeet that:

1. **Intercepts Dashboard Access**: Middleware checks `Profile.onboarded_at` and redirects incomplete users to `/onboarding`

2. **Collects User Nickname**: Simple, mobile-friendly form with Thai language text and real-time avatar preview

3. **Generates DiceBear Avatars**: Uses the lorelei style with user's nickname as seed for personalized, consistent avatars

4. **Extends Database Schema**: Adds `onboarded_at` (timestamptz) and `avatar_style` (text) columns with sensible defaults

5. **Creates UserAvatar Component**: New reusable component for displaying DiceBear avatars in sm/md/lg sizes

6. **Preserves Existing Systems**: MemberAvatar remains unchanged for incremental migration in future releases

7. **Supports Extensibility**: Avatar style column enables future multi-style support without database changes

8. **Handles Edge Cases**: Existing user pre-fill, validation errors, missing profiles, multiple tabs

9. **Maintains Performance**: Memoized avatar generation, middleware matcher optimization, minimal database queries

10. **Follows TripMeet Standards**: Mobile-first design, Thai language, design tokens, Tailwind CSS, Supabase RLS

The implementation requires no changes to existing trip features, authentication flows, or UI components beyond the new onboarding page and UserAvatar component. The feature is designed for safe deployment with clear rollback paths and backward compatibility.

---

**Next Steps:** Proceed to Tasks phase to break down implementation into specific development tasks.
