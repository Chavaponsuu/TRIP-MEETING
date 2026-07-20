# Requirements Document

## Introduction

The Onboarding Nickname Avatar feature introduces a post-authentication onboarding flow that guides users to set their nickname and generate a personalized avatar using DiceBear. This flow applies to both newly registered users and existing users who have not completed onboarding. The feature replaces the existing profile name field with user-chosen nicknames and introduces a new UserAvatar component to display DiceBear-generated avatars throughout the application.

## Glossary

- **Onboarding_System**: The post-authentication flow component that guides users through nickname and avatar setup
- **User**: Any authenticated person accessing the TripMeet application
- **Profile**: The database record in the profiles table containing user information
- **Nickname**: The user-chosen display name stored in the profile.name field
- **Avatar**: A DiceBear-generated SVG image representing the user visually
- **DiceBear**: A library that generates avatar images from a seed string (the user's nickname)
- **Avatar_Style**: The DiceBear style variant (fixed as "lorelei" in MVP, stored in avatar_style column for future extensibility)
- **UserAvatar_Component**: The new React component that displays DiceBear-generated avatars
- **MemberAvatar_Component**: The existing React component that displays initial-letter avatars (unchanged in MVP)
- **Onboarded_At**: The timestamp field in profiles table indicating when the user completed onboarding
- **Dashboard**: The protected route where users land after authentication
- **Auth_System**: Supabase authentication managing user sessions

## Requirements

### Requirement 1: Onboarding Flow Trigger

**User Story:** As a user, I want to be automatically directed to the onboarding flow after authentication if I haven't completed it yet, so that I can set up my profile before using the app.

#### Acceptance Criteria

1. WHEN THE User authenticates successfully, THE Onboarding_System SHALL check if the Profile has a null onboarded_at value
2. IF THE Profile.onboarded_at is null, THEN THE Onboarding_System SHALL redirect the User to the onboarding page before allowing access to the Dashboard
3. IF THE Profile.onboarded_at is not null, THEN THE Onboarding_System SHALL allow the User to proceed to the Dashboard
4. THE Onboarding_System SHALL apply this check to both newly registered users and existing users without onboarded_at values

### Requirement 2: Database Schema Extension

**User Story:** As a developer, I want the profiles table to store onboarding completion status and avatar style preference, so that the system can track which users have completed onboarding and support future avatar style options.

#### Acceptance Criteria

1. THE Profile SHALL include an onboarded_at column of type timestamptz with a default value of null
2. THE Profile SHALL include an avatar_style column of type text with a default value of "lorelei"
3. WHEN THE User completes onboarding, THE Onboarding_System SHALL set onboarded_at to the current timestamp
4. THE avatar_style column SHALL store the DiceBear style variant identifier

### Requirement 3: Nickname Input and Validation

**User Story:** As a user, I want to enter my preferred nickname during onboarding, so that other users can identify me by a name I choose.

#### Acceptance Criteria

1. THE Onboarding_System SHALL display a nickname input field in Thai language
2. THE Onboarding_System SHALL require the nickname to be between 1 and 50 characters
3. WHEN THE User submits the onboarding form, THE Onboarding_System SHALL validate the nickname meets the length requirement
4. THE Onboarding_System SHALL store the nickname in the Profile.name field, replacing any existing value
5. IF THE nickname validation fails, THEN THE Onboarding_System SHALL display an error message in Thai and prevent form submission

### Requirement 4: Avatar Generation

**User Story:** As a user, I want to see a preview of my avatar generated from my nickname during onboarding, so that I can visualize how I will appear to others.

#### Acceptance Criteria

1. WHEN THE User types in the nickname field, THE Onboarding_System SHALL generate a DiceBear avatar preview using the lorelei style
2. THE Onboarding_System SHALL use the nickname value as the seed for the DiceBear generation
3. THE Onboarding_System SHALL display the avatar preview in real-time as the User types
4. THE Onboarding_System SHALL set the Profile.avatar_style to "lorelei" when saving the profile
5. IF THE nickname field is empty, THEN THE Onboarding_System SHALL display a placeholder avatar

### Requirement 5: Onboarding Page UI Design

**User Story:** As a user, I want the onboarding interface to follow the TripMeet design system and be mobile-friendly, so that I have a consistent and accessible experience.

#### Acceptance Criteria

1. THE Onboarding_System SHALL implement the onboarding page using Tailwind CSS with TripMeet design tokens
2. THE Onboarding_System SHALL display all text content in Thai language
3. THE Onboarding_System SHALL use mobile-first responsive design
4. THE Onboarding_System SHALL display the avatar preview at a minimum size of 96x96 pixels
5. THE Onboarding_System SHALL include a submit button labeled in Thai
6. THE Onboarding_System SHALL display loading state during form submission
7. THE Onboarding_System SHALL center the onboarding form vertically and horizontally on the screen

### Requirement 6: UserAvatar Component Creation

**User Story:** As a developer, I want a new UserAvatar component that displays DiceBear avatars based on user profiles, so that I can show personalized avatars throughout the application.

#### Acceptance Criteria

1. THE UserAvatar_Component SHALL accept a Profile object as a prop
2. THE UserAvatar_Component SHALL accept an optional size prop with values of "sm", "md", or "lg"
3. WHEN THE Profile.name exists, THE UserAvatar_Component SHALL generate and display a DiceBear avatar using the lorelei style with the Profile.name as the seed
4. THE UserAvatar_Component SHALL render the avatar as an inline SVG or img element
5. THE UserAvatar_Component SHALL apply size classes: sm (32x32px), md (48x48px), lg (96x96px)
6. THE UserAvatar_Component SHALL display a rounded circle shape using Tailwind CSS
7. IF THE Profile.name is null or empty, THEN THE UserAvatar_Component SHALL display a fallback placeholder avatar

### Requirement 7: MemberAvatar Component Preservation

**User Story:** As a developer, I want the existing MemberAvatar component to remain unchanged during this release, so that migration to the new avatar system can be done incrementally in future releases.

#### Acceptance Criteria

1. THE MemberAvatar_Component SHALL continue to display initial-letter based avatars with colored backgrounds
2. THE MemberAvatar_Component SHALL remain unchanged in its implementation
3. THE MemberAvatar_Component SHALL continue to be used in existing trip member displays
4. THE Onboarding_System SHALL not modify any code related to MemberAvatar_Component

### Requirement 8: Onboarding Completion and Redirect

**User Story:** As a user, I want to be redirected to the dashboard automatically after completing onboarding, so that I can start using the app immediately.

#### Acceptance Criteria

1. WHEN THE User submits valid onboarding data, THE Onboarding_System SHALL save the nickname to Profile.name
2. WHEN THE User submits valid onboarding data, THE Onboarding_System SHALL save the avatar_style to Profile.avatar_style
3. WHEN THE User submits valid onboarding data, THE Onboarding_System SHALL set Profile.onboarded_at to the current timestamp
4. WHEN THE onboarding data is successfully saved, THE Onboarding_System SHALL redirect the User to the Dashboard
5. IF THE save operation fails, THEN THE Onboarding_System SHALL display an error message in Thai and allow the User to retry

### Requirement 9: DiceBear Package Installation

**User Story:** As a developer, I want the DiceBear packages to be installed in the project, so that avatar generation functionality is available.

#### Acceptance Criteria

1. THE Onboarding_System SHALL include the @dicebear/core package as a project dependency
2. THE Onboarding_System SHALL include the @dicebear/lorelei package as a project dependency
3. THE Onboarding_System SHALL use npm for package installation
4. THE Onboarding_System SHALL document the DiceBear dependency versions in package.json

### Requirement 10: Existing User Migration Support

**User Story:** As an existing user without onboarding completion, I want to be prompted to complete onboarding on my next login, so that I can get the new personalized avatar feature.

#### Acceptance Criteria

1. THE Onboarding_System SHALL treat all users with null onboarded_at values as requiring onboarding
2. THE Onboarding_System SHALL apply the onboarding flow check to existing users and new users equally
3. WHEN an existing User logs in and Profile.onboarded_at is null, THE Onboarding_System SHALL redirect the User to the onboarding page
4. THE Onboarding_System SHALL allow existing users to keep their current Profile.name value by pre-filling the nickname field
5. THE Onboarding_System SHALL generate the initial avatar preview from the existing Profile.name value if present

### Requirement 11: Authentication Flow Integration

**User Story:** As a user, I want the onboarding flow to integrate seamlessly with the existing authentication system, so that I experience a smooth transition from login/registration to onboarding.

#### Acceptance Criteria

1. WHEN THE User completes registration, THE Auth_System SHALL create the Profile with onboarded_at set to null
2. WHEN THE Auth_System redirects to the Dashboard route, THE Onboarding_System SHALL intercept the redirect if onboarded_at is null
3. THE Onboarding_System SHALL preserve authentication session state during the onboarding flow
4. THE Onboarding_System SHALL use the Next.js App Router middleware pattern for redirect interception
5. THE Onboarding_System SHALL check onboarding status using Supabase server-side client for security

### Requirement 12: Avatar Style Extensibility

**User Story:** As a product owner, I want the avatar system to support multiple DiceBear styles in the future, so that users can choose their preferred avatar appearance without requiring a database migration.

#### Acceptance Criteria

1. THE Profile.avatar_style column SHALL store the DiceBear style identifier as text
2. THE Onboarding_System SHALL set avatar_style to "lorelei" for all users in the MVP release
3. THE UserAvatar_Component SHALL read the Profile.avatar_style value when generating avatars
4. THE UserAvatar_Component SHALL use the Profile.avatar_style value to select the appropriate DiceBear style library
5. WHERE THE Profile.avatar_style is null, THE UserAvatar_Component SHALL default to "lorelei" style
