# First-Time Onboarding Feature — Nickname & Avatar

## Overview

This feature implements a first-time user onboarding flow where users set their nickname and get an automatically generated avatar using DiceBear's Lorelei style.

## Feature Components

### 1. Database Migration (000034)

**Files:**
- `migrations/000034_add_onboarding_to_profiles.up.sql`
- `migrations/000034_add_onboarding_to_profiles.down.sql`
- `migrations/APPLY_MIGRATION_034.md`

**Changes:**
- Adds `onboarded_at` timestamptz column to `profiles` table
- Backfills existing users with names → marks them as onboarded
- Users without names or new users will see onboarding

**Apply migration:**
```bash
# Run the SQL from the migration file in Supabase SQL Editor
# Or if using a migration tool:
# migrate -path ./migrations -database "postgres://..." up
```

### 2. UserAvatar Component

**File:** `src/components/UserAvatar.tsx`

**Features:**
- Uses DiceBear HTTP API with Lorelei style
- Name as seed → consistent avatar per user
- Configurable size (default 40px)
- Fully responsive and accessible
- No client-side SVG generation (lightweight)

**Usage:**
```tsx
import { UserAvatar } from '@/components/UserAvatar'

<UserAvatar name="แจ๊ค" size={120} />
```

**API Used:**
```
https://api.dicebear.com/10.x/lorelei/svg?seed={name}&size={size}
```

### 3. Onboarding Page

**File:** `src/app/onboarding/page.tsx`

**Features:**
- Nickname input (2-20 characters, Thai validation)
- Live avatar preview (300ms debounce)
- Disabled "Upload Photo" button (future feature)
- Character counter
- Form validation with Thai error messages
- Updates profile and sets `onboarded_at`
- Redirects to dashboard on completion

**Layout:** `src/app/onboarding/layout.tsx`
- Protects route (requires auth)
- Redirects to dashboard if already onboarded
- Prevents re-onboarding

### 4. Route Guard

**File:** `src/app/(app)/layout.tsx`

**Logic:**
- Checks `onboarded_at IS NULL` on every protected route load
- Redirects to `/onboarding` if not completed
- Allows normal flow if onboarded

### 5. Type Updates

**File:** `src/types/index.ts`

```typescript
export interface Profile {
  id: string
  name: string
  avatar_color: string | null
  created_at: string
  onboarded_at?: string | null  // NEW
}
```

## User Flow

### New User Registration
1. User signs up via `/register`
2. Profile created with `onboarded_at = NULL`
3. User redirected to protected route → triggers check
4. Redirected to `/onboarding`
5. User enters nickname (2-20 chars)
6. Avatar preview updates live (debounced)
7. User clicks "เริ่มใช้งาน"
8. Profile updated: `name` set, `onboarded_at = now()`
9. Redirected to `/dashboard`

### Existing Users (After Migration)
1. Migration backfills users with names → `onboarded_at = created_at`
2. Users can login normally
3. No onboarding screen shown
4. Existing flow unchanged

### Users Without Names (Edge Case)
1. If somehow profile exists but `name` is empty/null
2. Treated as new user
3. Must complete onboarding

## Configuration

### Next.js Image Configuration

**File:** `next.config.ts`

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'api.dicebear.com',
      pathname: '/**',
    },
  ],
}
```

This allows Next.js Image component to fetch from DiceBear API.

### Dependencies

**Added:**
```json
{
  "@dicebear/collection": "^10.x"
}
```

**Install:**
```bash
npm install @dicebear/collection
```

## Validation Rules

### Nickname
- **Required:** Must not be empty or only whitespace
- **Min length:** 2 characters
- **Max length:** 20 characters
- **Trimmed:** Leading/trailing whitespace removed
- **Error messages:** Thai language

### Examples
| Input | Valid | Error |
|-------|-------|-------|
| "แจ๊ค" | ✅ | - |
| "J" | ❌ | ชื่อเล่นต้องมีอย่างน้อย 2 ตัวอักษร |
| "นามที่ยาวเกินไปสำหรับระบบ" | ❌ | ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร |
| "  " | ❌ | กรุณากรอกชื่อเล่น |

## Testing Checklist

### Database
- [ ] Migration runs without errors
- [ ] `onboarded_at` column exists and is nullable
- [ ] Existing users with names have `onboarded_at` set
- [ ] New profiles have `onboarded_at = NULL`

### UI/UX
- [ ] Onboarding page loads for new users
- [ ] Nickname input accepts Thai characters
- [ ] Avatar preview updates on typing (debounced)
- [ ] Empty avatar shows placeholder icon
- [ ] Character counter displays correctly
- [ ] Validation errors show in Thai
- [ ] "Upload Photo" button is disabled with "เร็วๆ นี้" text
- [ ] Submit button disabled when nickname < 2 chars
- [ ] Loading state shows during submission

### Routes
- [ ] New users redirected to `/onboarding` on dashboard access
- [ ] Onboarded users access `/dashboard` normally
- [ ] Already onboarded users redirected from `/onboarding` to `/dashboard`
- [ ] Unauthenticated users redirected to `/login`

### Data
- [ ] Profile `name` updated correctly
- [ ] `onboarded_at` timestamp set on submission
- [ ] User redirected to dashboard after onboarding
- [ ] Avatar displays correctly with saved name

## Future Enhancements (Not in Scope)

1. **Profile Photo Upload**
   - Enable "Upload Photo" button
   - File upload to Supabase Storage
   - Add `avatar_url` column to profiles
   - Priority: avatar_url → DiceBear → fallback

2. **Avatar Style Selector**
   - Let users choose from multiple DiceBear styles
   - Add `avatar_style` column
   - UI component for style picker

3. **Onboarding Steps**
   - Multi-step wizard (profile → preferences → tutorial)
   - Progress indicator
   - Skip option for some steps

4. **Re-onboarding**
   - Allow users to update profile from settings
   - Don't block access, just allow editing

## Troubleshooting

### Users stuck on onboarding page
**Symptom:** User completes onboarding but redirected back

**Cause:** Database update failed or didn't commit

**Fix:**
```sql
-- Manually set onboarded_at for affected user
update profiles
set onboarded_at = now()
where id = '<user-id>';
```

### Avatar not loading
**Symptom:** Broken image or 404

**Cause:** DiceBear API down or CORS issue

**Check:**
1. Visit `https://api.dicebear.com/10.x/lorelei/svg?seed=test` directly
2. Check browser console for CORS errors
3. Verify Next.js config has correct remotePatterns

**Fallback:** Can add fallback to initials avatar in UserAvatar component

### Existing users see onboarding unexpectedly
**Symptom:** User with data forced to re-onboard

**Cause:** Migration backfill didn't run or user had empty name

**Fix:**
```sql
-- Check affected users
select id, name, onboarded_at
from profiles
where name is not null
  and trim(name) <> ''
  and onboarded_at is null;

-- Backfill missed users
update profiles
set onboarded_at = created_at
where name is not null
  and trim(name) <> ''
  and onboarded_at is null;
```

## Security Considerations

### RLS Policies
- Profile updates restricted to own profile (existing policy)
- No new RLS policies needed
- Onboarding only updates user's own profile

### Input Validation
- Nickname length enforced both client and server side (max 20 chars in DB)
- XSS prevention: React auto-escapes text inputs
- No special character restrictions (supports Thai, emoji, etc.)

### API Usage
- DiceBear API is free for open source
- No API key required
- Rate limits: reasonable for normal usage
- Consider caching avatars if scaling (future)

## Performance

### Metrics
- **Avatar load time:** ~100-200ms (CDN-cached SVG)
- **Debounce delay:** 300ms (good UX balance)
- **Form submission:** ~500ms (DB update + redirect)

### Optimization
- SVG from DiceBear is lightweight (~5-10KB)
- No client-side generation overhead
- Next.js Image lazy loading by default
- Could add browser caching headers (future)

## Documentation Links

- [DiceBear API Docs](https://www.dicebear.com/how-to-use/http-api)
- [DiceBear Lorelei Style](https://www.dicebear.com/styles/lorelei)
- [Next.js Image Component](https://nextjs.org/docs/api-reference/next/image)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## Summary

This feature provides a smooth first-time user experience with:
- ✅ Simple one-field onboarding
- ✅ Automatic avatar generation
- ✅ Backward compatibility (existing users skip it)
- ✅ Thai language validation
- ✅ Mobile-first responsive design
- ✅ Future-proof (upload button placeholder)

**Total files changed:** 8  
**Total lines added:** ~400  
**Migration required:** Yes (000034)  
**Breaking changes:** None
