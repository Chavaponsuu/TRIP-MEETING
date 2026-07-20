# Implementation Plan: Onboarding Nickname Avatar

## Overview

This implementation plan converts the onboarding nickname avatar feature design into actionable TypeScript/React coding tasks. The feature introduces a post-authentication onboarding flow where users set their nickname and generate a DiceBear avatar. The implementation follows Next.js 14 App Router patterns with Supabase authentication, using TypeScript, Tailwind CSS, and mobile-first responsive design with Thai language UI text.

## Tasks

- [ ] 1. Set up database schema and install dependencies
  - Create migration files for `onboarded_at` and `avatar_style` columns
  - Run migration to add columns to profiles table
  - Install @dicebear/core and @dicebear/lorelei packages via npm
  - Update TypeScript Profile interface in src/types/index.ts with new fields
  - _Requirements: 2.1, 2.2, 2.4, 9.1, 9.2, 9.3_

- [ ] 2. Create avatar generation utility library
  - [ ] 2.1 Implement src/lib/avatar.ts utility functions
    - Write `generateAvatar()` function with seed, style, and size parameters
    - Write `generateAvatarDataUrl()` function for img src usage
    - Write `getAvatarSeed()` helper to extract seed from profile with fallback
    - Add TypeScript interfaces for GenerateAvatarOptions and AvatarStyle type
    - _Requirements: 4.2, 12.3_

  - [ ]* 2.2 Write unit tests for avatar generation utilities
    - Test deterministic generation (same seed produces same output)
    - Test fallback behavior for empty/null seeds
    - Test different size parameters
    - _Requirements: 4.2_

- [ ] 3. Create UserAvatar component
  - [ ] 3.1 Implement src/components/user/UserAvatar.tsx client component
    - Create UserAvatarProps interface (profile, size, className)
    - Implement size mapping (sm: 32px, md: 48px, lg: 96px)
    - Generate DiceBear avatar using profile.name as seed and profile.avatar_style
    - Apply rounded-full Tailwind class for circle shape
    - Handle fallback for null/empty profile.name using profile.id
    - Default to 'lorelei' style when avatar_style is null
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.4, 12.5_

  - [ ]* 3.2 Write unit tests for UserAvatar component
    - Test rendering with different size props (sm, md, lg)
    - Test fallback behavior for missing profile.name
    - Test avatar_style fallback to 'lorelei'
    - _Requirements: 6.5, 6.7, 12.5_

- [ ] 4. Implement onboarding page
  - [ ] 4.1 Create src/app/(app)/onboarding/page.tsx server component wrapper
    - Check authentication status using Supabase server client
    - Redirect to /login if user is not authenticated
    - Fetch existing profile to check if already onboarded
    - Redirect to /dashboard if onboarded_at is not null
    - Pass existing profile.name to client component for pre-fill
    - _Requirements: 1.1, 8.1, 10.4_

  - [ ] 4.2 Create onboarding form client component
    - Implement nickname state with useState
    - Implement error state and isSubmitting state
    - Create nickname validation function (1-50 characters, trimmed)
    - Display Thai language text: title "สร้างโปรไฟล์", subtitle "เลือกชื่อเล่นของคุณ"
    - Add nickname input field with Thai label "ชื่อเล่น" and placeholder
    - Set maxLength={50} on input field
    - Apply mobile-first responsive layout with vertical/horizontal centering
    - Use TripMeet design tokens (colors, border radius, spacing)
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3, 5.5, 5.7_

  - [ ] 4.3 Implement real-time avatar preview in onboarding form
    - Display avatar preview at 96x96 pixels minimum size
    - Update avatar preview in real-time as user types nickname
    - Use nickname value as DiceBear seed for preview generation
    - Display placeholder avatar when nickname field is empty
    - Center avatar preview above nickname input field
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 5.4_

  - [ ] 4.4 Implement form submission handler
    - Run nickname validation on submit
    - Display Thai error messages for validation failures
    - Show loading state during submission (Thai text: "กำลังบันทึก...")
    - Save nickname to Profile.name field
    - Set Profile.avatar_style to 'lorelei'
    - Set Profile.onboarded_at to current timestamp
    - Handle database save errors with Thai error message
    - Redirect to /dashboard on successful save
    - _Requirements: 3.3, 3.4, 3.5, 4.4, 5.6, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 4.5 Implement profile pre-fill for existing users
    - Load existing profile.name on component mount via useEffect
    - Pre-fill nickname input field with existing name if present
    - Generate initial avatar preview from existing name
    - _Requirements: 10.4, 10.5_

- [ ] 5. Checkpoint - Verify onboarding page functionality
  - Test onboarding page loads with correct Thai UI text
  - Test avatar preview updates as user types
  - Test validation error messages display in Thai
  - Test form submission saves data and redirects
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Enhance middleware with onboarding check
  - [ ] 6.1 Update src/lib/supabase/middleware.ts (or middleware.ts)
    - Add onboarding status check after authentication
    - Fetch Profile.onboarded_at for authenticated users on protected routes
    - Redirect to /onboarding if onboarded_at is null
    - Skip onboarding check if already on /onboarding page
    - Allow access to protected routes if onboarded_at is not null
    - Preserve authentication session during redirect
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 6.2 Write integration tests for middleware onboarding logic
    - Test redirect to /onboarding when onboarded_at is null
    - Test no redirect when onboarded_at has timestamp
    - Test redirect to /login for unauthenticated users
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. Verify MemberAvatar component preservation
  - Confirm src/components/members/MemberAvatar.tsx remains unchanged
  - Verify MemberAvatar continues to display initial-letter avatars
  - Ensure no modifications to MemberAvatar-related code
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Test complete user journeys end-to-end
  - [ ] 8.1 Test new user registration flow
    - Register new account → verify redirect to onboarding
    - Complete onboarding → verify redirect to dashboard
    - Verify onboarded_at timestamp is set in database
    - _Requirements: 1.1, 1.2, 8.3, 8.4, 11.1_

  - [ ] 8.2 Test existing user without onboarding
    - Login with existing account (onboarded_at null)
    - Verify redirect to onboarding with pre-filled name
    - Complete onboarding → verify redirect to dashboard
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 8.3 Test returning user with completed onboarding
    - Login with account that has onboarded_at set
    - Verify direct access to dashboard without onboarding interruption
    - Verify UserAvatar displays throughout app
    - _Requirements: 1.3_

- [ ] 9. Final checkpoint - Complete feature verification
  - Verify all database columns exist and have correct defaults
  - Verify DiceBear packages are installed in package.json
  - Verify TypeScript types compile without errors
  - Verify Thai language text displays correctly on all screens
  - Verify mobile responsive design works on small viewports
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- The design uses TypeScript with Next.js 14 App Router patterns as detected from the codebase
- All UI text must be in Thai language per project conventions
- Mobile-first responsive design is critical (primary device is phone)
- MemberAvatar component is intentionally left unchanged for incremental migration in future releases
- Avatar style is fixed to 'lorelei' in MVP; avatar_style column enables future extensibility
- Middleware onboarding check must be server-side for security (cannot be bypassed client-side)
- Each task references specific requirements for traceability
- Property-based testing is minimal in this feature due to UI/integration focus

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "7", "8.1", "8.2"] },
    { "id": 7, "tasks": ["8.3"] }
  ]
}
```
