# Implementation Plan: Trip Management & Collaboration

## Overview

This implementation extends TripMeet with comprehensive trip management and collaboration features including trip lifecycle status, role-based permissions, RSVP system, voting polls, and collaborative itinerary planning. The implementation follows the existing TripMeet architecture (Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase) and maintains compatibility with current features and only use supabase as a backend.

## Tasks

- [x] 1. Database Schema Setup - Extend Existing Tables
  - [x] 1.1 Create migration for trips table extensions
    - Add columns: status, date_mode, start_date, end_date, budget, currency, cover_image_url
    - Add check constraints for status, date_mode, and date validation
    - Add indexes on status and start_date
    - _Requirements: 1.1, 1.3, 1.4, 1.6_
  
  - [x] 1.2 Create migration for destination field migration (text → text[])
    - Add destination_new column as text[]
    - Backfill data: destination_new = ARRAY[destination]
    - Drop old destination column and rename destination_new
    - Add NOT NULL constraint and array_length check
    - _Requirements: 1.8, 1.9, 1.10, 1.11_
  
  - [x] 1.3 Create migration for trip_members table extensions
    - Add columns: role, rsvp_status, rsvp_updated_at, reminder_sent_at
    - Add check constraints for role and rsvp_status
    - Add indexes on role and rsvp_status
    - Create trigger for auto-updating rsvp_updated_at
    - Backfill owner role for existing trip creators
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 7.1_

  - [x] 1.4 Verify and extend trip_invitations table constraints
    - Add unique constraint on (trip_id, invitee_id) if missing
    - Verify status check constraint for pending/accepted/declined
    - _Requirements: 6.1, 6.2_

- [ ] 2. Database Schema Setup - New Tables for Polls
  - [x] 2.1 Create polls table with constraints
    - Create table with all columns: id, trip_id, created_by, title, description, poll_type, deadline, allow_vote_changes, results_visibility, status, created_at, updated_at
    - Add check constraints for poll_type (single_choice, multi_choice, ranked) and status
    - Add indexes on trip_id, status, deadline, created_at
    - _Requirements: 8.1_
  
  - [x] 2.2 Create poll_options table with vote counting
    - Create table: id, poll_id, option_text, option_data (jsonb), display_order, vote_count, created_at
    - Add indexes on poll_id and display_order
    - _Requirements: 8.2_
  
  - [~] 2.3 Create poll_votes table with type-specific constraints
    - Create table: id, poll_id, user_id, option_id, rank, created_at, updated_at
    - Add unique index for single_choice polls (poll_id, user_id)
    - Add unique index for ranked polls (poll_id, user_id, rank)
    - Add standard indexes on poll_id, user_id, option_id
    - Create trigger to update poll_options.vote_count on insert/update/delete
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 8.9_

- [x] 3. Database Schema Setup - New Tables for Itinerary
  - [x] 3.1 Create itinerary_items table
    - Create table: id, trip_id, day_number, item_type, title, description, start_time, end_time, location, status, display_order, created_by, created_at, updated_at
    - Add check constraints for item_type and status
    - Add check constraint for end_time > start_time
    - Add indexes on trip_id, day_number, ordering fields, status, created_by
    - _Requirements: 14.1, 14.3_

  - [x] 3.2 Create itinerary_reactions table
    - Create table: id, itinerary_item_id, user_id, reaction_type, created_at
    - Add check constraint for reaction_type (thumbs_up, heart, fire, thinking, thumbs_down)
    - Add unique constraint on (itinerary_item_id, user_id, reaction_type)
    - Add indexes on itinerary_item_id and user_id
    - _Requirements: 18.1_
  
  - [x] 3.3 Create itinerary_comments table
    - Create table: id, itinerary_item_id, user_id, text, created_at
    - Add indexes on itinerary_item_id, user_id, created_at
    - _Requirements: 18.2_

- [x] 4. Row Level Security Policies - Extended Tables
  - [x] 4.1 Add RLS policies for trips table (extended)
    - Update existing policies to account for new role-based permissions
    - Allow owner/co_organizer to update trip details
    - Ensure member-based SELECT continues to work with new columns
    - _Requirements: 2.4, 19.6_
  
  - [x] 4.2 Add RLS policies for trip_members table (extended)
    - Allow members to update their own rsvp_status
    - Allow owner to assign/revoke co_organizer role
    - Prevent removing owner role
    - Update existing SELECT policy for new columns
    - _Requirements: 2.5, 3.4, 3.5, 19.6_

- [x] 5. Row Level Security Policies - Poll Tables
  - [x] 5.1 Add RLS policies for polls table
    - Enable RLS on polls table
    - Allow SELECT for all trip members (via trip_members join)
    - Restrict INSERT to owner/co_organizer roles
    - Allow creator to UPDATE/DELETE own polls
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [x] 5.2 Add RLS policies for poll_options table
    - Enable RLS on poll_options table
    - Allow SELECT for all trip members (via polls → trip_members join)
    - Restrict INSERT/UPDATE/DELETE to poll creator
    - _Requirements: 19.1, 19.2_

  - [x] 5.3 Add RLS policies for poll_votes table
    - Enable RLS on poll_votes table
    - Allow SELECT for all trip members (via polls → trip_members join)
    - Allow INSERT for any trip member
    - Allow UPDATE/DELETE only for user's own votes
    - _Requirements: 19.2, 19.4, 19.5_

- [x] 6. Row Level Security Policies - Itinerary Tables
  - [x] 6.1 Add RLS policies for itinerary_items table
    - Enable RLS on itinerary_items table
    - Allow SELECT for all trip members (via trip_members join)
    - Allow INSERT for any trip member
    - Allow UPDATE/DELETE for item creator and owner/co_organizer
    - _Requirements: 14.4, 14.5, 14.6, 19.1, 19.2, 19.4_
  
  - [x] 6.2 Add RLS policies for itinerary_reactions table
    - Enable RLS on itinerary_reactions table
    - Allow SELECT for all trip members
    - Allow INSERT/DELETE for user's own reactions
    - _Requirements: 18.3, 19.2, 19.5_
  
  - [x] 6.3 Add RLS policies for itinerary_comments table
    - Enable RLS on itinerary_comments table
    - Allow SELECT for all trip members
    - Allow INSERT for any trip member
    - Allow UPDATE/DELETE for user's own comments
    - _Requirements: 18.3, 19.2, 19.5_

- [~] 7. Checkpoint - Database Schema Complete
  - Ensure all migrations run successfully
  - Verify all RLS policies are active
  - Test basic CRUD operations on new tables
  - Ask the user if questions arise

- [x] 8. TypeScript Type Definitions
  - [x] 8.1 Extend existing Trip interface in src/types/index.ts
    - Add new fields: status, date_mode, start_date, end_date, budget, currency, cover_image_url
    - Change destination from string to string[]
    - Add type unions for status and date_mode
    - _Requirements: 1.1, 1.11_

  - [x] 8.2 Extend TripMember interface in src/types/index.ts
    - Add fields: role, rsvp_status, rsvp_updated_at, reminder_sent_at
    - Add type unions for role and rsvp_status
    - _Requirements: 2.1, 3.1_
  
  - [x] 8.3 Add new Poll, PollOption, PollVote interfaces
    - Create Poll interface with all fields and type unions
    - Create PollOption interface with option_data JSONB type
    - Create PollVote interface with optional rank field
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [x] 8.4 Add new Itinerary interfaces
    - Create ItineraryItem interface with all fields and type unions
    - Create ItineraryReaction interface with reaction_type union
    - Create ItineraryComment interface
    - _Requirements: 14.1, 18.1, 18.2_

- [x] 9. Database Helper Functions
  - [x] 9.1 Create database function for role validation
    - Implement validate_trip_role() PostgreSQL function
    - Check if user has owner or co_organizer role for a trip
    - Use in RLS policies and triggers
    - _Requirements: 2.4, 2.5_
  
  - [x] 9.2 Create database function for date confirmation
    - Implement confirm_trip_dates() PostgreSQL function
    - Update trips.start_date, end_date, date_mode, status
    - Log confirmation action (trip_id, confirmed_by, confirmed_at, dates)
    - _Requirements: 1.7, 12.4, 12.5_

- [x] 10. Edge Function for Poll Deadline Processing
  - [x] 10.1 Create process-poll-deadlines Edge Function
    - Create Supabase Edge Function in supabase/functions/process-poll-deadlines/
    - Query polls with status='open' and deadline <= now()
    - Update status='closed' for expired polls
    - Handle errors per-poll without aborting batch
    - Log processing actions
    - _Requirements: 12.1, 12.2, 20.2, 20.3_

  - [x] 10.2 Set up pg_cron job for poll deadline processing
    - Configure pg_cron to invoke process-poll-deadlines every 5 minutes
    - Test cron execution and error handling
    - _Requirements: 12.3, 20.2_

- [x] 11. Extended useTrip Hook
  - [x] 11.1 Update useTrip hook to include new trip fields
    - Extend SELECT query to include status, dates, budget, destination array
    - Update real-time subscription to listen for trips table changes
    - Ensure backward compatibility with existing trip views
    - _Requirements: 1.1, 1.11_
  
  - [x] 11.2 Update useTrip to include extended member data
    - Include role, rsvp_status in trip_members SELECT
    - Update real-time subscription for trip_members changes
    - _Requirements: 2.1, 3.1_

- [x] 12. New usePolls Hook
  - [x] 12.1 Create usePolls hook in src/hooks/usePolls.ts
    - Implement fetchPolls with full nested SELECT (options, votes, creator)
    - Set up real-time subscription for polls and poll_votes tables
    - Return polls array and loading state
    - _Requirements: 8.1, 8.2, 8.4, 20.1_
  
  - [x] 12.2 Add createPoll mutation function
    - Implement createPoll with validation (min 2 options)
    - Handle poll creation with options in transaction
    - Return created poll data or error
    - _Requirements: 8.3, 8.10_
  
  - [x] 12.3 Add vote mutation function
    - Implement vote function for all poll types
    - Handle single_choice (upsert), multi_choice (insert), ranked (upsert with rank)
    - Check allow_vote_changes flag
    - Return error if poll is closed
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 12.2_


- [x] 13. New useItinerary Hook
  - [x] 13.1 Create useItinerary hook in src/hooks/useItinerary.ts
    - Implement fetchItems with nested SELECT (creator, reactions, comments)
    - Order by day_number, start_time, display_order
    - Set up real-time subscription for all itinerary tables
    - Return items array and loading state
    - _Requirements: 14.1, 14.2, 18.1, 18.2, 20.1_

  - [x] 13.2 Add itinerary mutation functions
    - Implement createItem with validation
    - Implement updateItemStatus (proposed → confirmed) for organizers
    - Implement deleteItem with permission check
    - Implement reorderItems for drag-and-drop support
    - _Requirements: 14.4, 14.5, 14.6, 14.7_
  
  - [x] 13.3 Add reaction and comment functions
    - Implement addReaction with unique constraint handling
    - Implement removeReaction
    - Implement addComment
    - All functions update via real-time subscription
    - _Requirements: 18.3, 18.4_

- [x] 14. New useRSVP Hook
  - [x] 14.1 Create useRSVP hook in src/hooks/useRSVP.ts
    - Implement updateRSVP function for current user
    - Update trip_members.rsvp_status with automatic timestamp
    - Return error handling
    - _Requirements: 3.4_
  
  - [x] 14.2 Add sendReminders function
    - Query members with rsvp_status='maybe'
    - Filter out recently reminded (within 48 hours)
    - Send in-app notifications (integrate with notification system)
    - Update reminder_sent_at timestamp
    - Return count of reminders sent
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 15. Trip Settings Page - Role Management
  - [x] 15.1 Create /trips/[id]/settings page
    - Create new page at src/app/(app)/trips/[id]/settings/page.tsx
    - Add route protection (owner/co_organizer only)
    - Display current trip settings (status, dates, budget)
    - _Requirements: 2.4_
  
  - [x] 15.2 Create RoleManager component
    - Display all trip members with their roles
    - Show role change controls (owner only)
    - Implement assign co_organizer action
    - Implement revoke co_organizer action
    - Prevent owner role removal
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 15.3 Create DateConfirmModal component
    - Display availability heatmap for organizer review
    - Show date range picker for start_date and end_date
    - Call confirm_trip_dates() database function on submit
    - Update trip status to 'planning' and date_mode to 'fixed'
    - Show confirmation success message
    - _Requirements: 1.5, 1.7, 12.4_

- [x] 16. RSVP Components
  - [x] 16.1 Create RSVPStatus component
    - Display current user's RSVP status
    - Show selection UI for pending/going/maybe/not_going
    - Use useRSVP hook to update status
    - Show timestamp of last update
    - Thai language labels: "รอดำเนินการ", "ไปแน่นอน", "อาจจะไป", "ไม่ไป"
    - _Requirements: 3.1, 3.3, 3.4, 22.1_
  
  - [x] 16.2 Create RSVPSummary component
    - Display RSVP breakdown (count per status)
    - Show member list grouped by status
    - Display "Send Reminder" button for organizers (maybe members only)
    - Integrate with useRSVP sendReminders function
    - _Requirements: 3.5, 7.2, 7.3_

- [x] 17. Poll Components
  - [x] 17.1 Create PollCreator component
    - Form for poll creation (title, description, type, options)
    - Support adding/removing options (min 2)
    - Date picker for deadline (optional)
    - Toggles for allow_vote_changes and results_visibility
    - Use usePolls createPoll function
    - Owner/co_organizer only
    - _Requirements: 8.1, 8.2, 8.3, 8.10_
  
  - [x] 17.2 Create PollCard component
    - Display poll title, description, deadline countdown
    - Show poll options with vote counts (if results visible)
    - Display voting UI based on poll_type
    - Single choice: radio buttons
    - Multi choice: checkboxes
    - Ranked: draggable ordered list
    - Show "Poll Closed" badge when status='closed'
    - _Requirements: 8.1, 8.5, 8.6, 8.7, 12.2_

  - [x] 17.3 Create PollVoteCard component
    - Handle vote submission for all poll types
    - Show user's current votes with edit/delete actions (if allowed)
    - Display live results or "hidden until close" message
    - Real-time update when other members vote
    - Use usePolls vote function
    - _Requirements: 8.8, 8.9, 12.3_

- [x] 18. Itinerary Components
  - [x] 18.1 Create ItineraryTimeline component
    - Display itinerary items grouped by day_number
    - Sticky day headers with date (if trip dates confirmed)
    - Vertical timeline design for mobile
    - Show proposed vs confirmed items with visual distinction
    - Use useItinerary hook for data and real-time updates
    - _Requirements: 14.1, 14.2, 22.1_
  
  - [x] 18.2 Create ItineraryItemCard component
    - Display item type icon, title, time range, location
    - Show description in expandable section
    - Display creator badge and status badge (proposed/confirmed)
    - Show reactions bar with counts per reaction type
    - Show comment count with expand/collapse
    - _Requirements: 14.1, 18.1, 18.2_
  
  - [x] 18.3 Create ItineraryItemForm component (bottom sheet)
    - Form fields: item_type, title, description, start_time, end_time, location, day_number
    - Item type selector with Thai labels and icons
    - Time pickers for start/end time with validation
    - Save as "proposed" status by default
    - Use useItinerary createItem function
    - Mobile-first bottom sheet UI
    - _Requirements: 14.4, 22.1_
  
  - [x] 18.4 Create ItineraryReactions component
    - Display emoji reaction buttons (👍 ❤️ 🔥 🤔 👎)
    - Show user's own reactions as highlighted
    - Click to toggle reaction on/off
    - Show reaction counts per type
    - Use useItinerary addReaction/removeReaction functions
    - _Requirements: 18.1, 18.3_

  - [x] 18.5 Create ItineraryComments component
    - Display comment thread for specific itinerary item
    - Show user avatar, name, timestamp for each comment
    - Input field for adding new comment
    - Real-time updates when new comments arrive
    - Use useItinerary addComment function
    - _Requirements: 18.2, 18.3, 18.4_

- [x] 19. Trip Detail Page Extensions
  - [x] 19.1 Update /trips/[id]/page.tsx with new tabs
    - Extend existing tabs: add "โหวต" (Polls), "กำหนดการ" (Itinerary), "ตั้งค่า" (Settings)
    - Keep existing tabs: "วันที่" (Dates), "สมาชิก" (Members), "สนทนา" (Comments)
    - Update tab routing and active state management
    - _Requirements: 22.1_
  
  - [x] 19.2 Create Polls tab view
    - Display list of all polls for the trip
    - Show create poll button (owner/co_organizer only)
    - Integrate PollCreator, PollCard, PollVoteCard components
    - Sort polls by created_at descending
    - _Requirements: 8.10_
  
  - [x] 19.3 Create Itinerary tab view
    - Display ItineraryTimeline component
    - Floating action button to add new itinerary item
    - Show empty state when no items exist
    - Integrate ItineraryItemForm bottom sheet
    - _Requirements: 14.1, 14.4_
  
  - [x] 19.4 Update Members tab to show RSVP status
    - Display RSVPStatus component for current user
    - Display RSVPSummary component showing all members
    - Show role badges (owner/co_organizer) next to names
    - _Requirements: 2.1, 3.5_

- [x] 20. Trip Creation/Edit Form Updates
  - [x] 20.1 Update trip creation form for destination array
    - Change destination input to support multiple entries
    - Add/remove destination fields dynamically
    - Validate at least 1 destination required
    - Update form submission to send destination as array
    - _Requirements: 1.11, 1.12_

  - [x] 20.2 Add budget and status fields to trip form
    - Add budget numeric input with currency selector (default THB)
    - Add status selector (draft/planning/confirmed/ongoing/completed/cancelled)
    - Add cover_image_url input (optional)
    - Update form validation and submission
    - _Requirements: 1.1, 1.3_
  
  - [x] 20.3 Update trip edit form for date confirmation
    - Show current date_mode and dates (if fixed)
    - Add "Confirm Dates" button for organizers (when date_mode='flexible')
    - Open DateConfirmModal on click
    - Show confirmed dates in read-only when date_mode='fixed'
    - _Requirements: 1.4, 1.5, 1.7_

- [x] 21. Trip List/Card Updates
  - [x] 21.1 Update TripCard component for new fields
    - Display multiple destinations (comma-separated or badges)
    - Show trip status badge with color coding
    - Display confirmed dates if date_mode='fixed'
    - Show RSVP summary (X going, Y maybe)
    - _Requirements: 1.1, 1.11, 3.5_


- [ ] 22. Friend Invitation Flow
  - [~] 22.1 Update friend invitation UI
    - Add "Invite to Trip" action in friends list
    - Create trip selector modal for invitation
    - Use existing trip_invitations table
    - Show pending invitations in trip settings
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [~] 22.2 Create invitation notification view
    - Display pending trip_invitations for current user
    - Show trip details (name, emoji, destination, inviter)
    - Accept/Decline actions
    - Create trip_member record on accept
    - Update status on decline
    - _Requirements: 6.3, 6.4, 6.6_

- [ ] 23. Real-time Subscription Setup
  - [~] 23.1 Enable Supabase Realtime on new tables
    - Enable replication for: polls, poll_votes, itinerary_items, itinerary_reactions, itinerary_comments
    - Configure in Supabase dashboard → Database → Replication
    - Verify real-time events are broadcast correctly
    - _Requirements: 20.1_

  - [~] 23.2 Test real-time updates across all features
    - Verify poll vote updates appear live for all members
    - Verify itinerary changes broadcast immediately
    - Verify reactions and comments update in real-time
    - Test with multiple browser sessions
    - Ensure <500ms latency target is met
    - _Requirements: 14.8, 18.4, 20.1_

- [~] 24. Checkpoint - Core Features Complete
  - Ensure all database operations work correctly
  - Verify RLS policies prevent unauthorized access
  - Test real-time subscriptions across all new features
  - Test role-based permissions (owner, co_organizer, member)
  - Ask the user if questions arise

- [ ] 25. Mobile UI Polish
  - [~] 25.1 Optimize poll components for mobile
    - Ensure touch-friendly vote controls
    - Test bottom sheet modals on various screen sizes
    - Verify scrolling behavior in poll lists
    - Test deadline countdown display on narrow screens
    - _Requirements: 22.1_
  
  - [~] 25.2 Optimize itinerary timeline for mobile
    - Test vertical timeline layout on phones
    - Ensure sticky day headers work correctly
    - Test drag-and-drop reordering on touch devices
    - Verify bottom sheet forms are accessible
    - Test reaction buttons are touch-friendly
    - _Requirements: 22.1_
  
  - [~] 25.3 Test RSVP and role management on mobile
    - Verify status selector is easy to use on small screens
    - Test role management UI on phones
    - Ensure settings page is mobile-responsive
    - Test date confirmation modal on mobile
    - _Requirements: 22.1_

- [ ]* 26. Integration Testing
  - [ ]* 26.1 Write integration tests for poll workflows
    - Test poll creation with various types
    - Test voting on single/multi/ranked polls
    - Test poll deadline auto-close
    - Test results visibility settings

  - [ ]* 26.2 Write integration tests for itinerary workflows
    - Test itinerary item creation and editing
    - Test status change from proposed to confirmed
    - Test reactions and comments
    - Test drag-and-drop reordering
  
  - [ ]* 26.3 Write integration tests for RSVP workflows
    - Test RSVP status updates
    - Test reminder sending logic
    - Test 48-hour reminder throttling
    - Test RSVP summary calculations
  
  - [ ]* 26.4 Write integration tests for role management
    - Test owner role assignment on trip creation
    - Test co_organizer assignment and revocation
    - Test permission enforcement (create polls, confirm items)
    - Test owner role protection

- [ ]* 27. End-to-End Testing
  - [ ]* 27.1 E2E test: Complete poll lifecycle
    - Create trip as owner
    - Create poll with options
    - Vote as multiple members
    - Wait for deadline to pass
    - Verify poll auto-closes
    - Verify results displayed correctly
  
  - [ ]* 27.2 E2E test: Collaborative itinerary planning
    - Create trip with confirmed dates
    - Member A adds proposed itinerary item
    - Member B reacts and comments
    - Organizer confirms item
    - Test real-time updates across sessions
  
  - [ ]* 27.3 E2E test: RSVP and date confirmation flow
    - Create trip with flexible dates
    - Members mark availability
    - Members set RSVP status
    - Organizer reviews heatmap
    - Organizer confirms dates
    - Verify trip status updates to 'planning'

- [~] 28. Final Checkpoint - Complete Implementation
  - Verify all requirements are implemented
  - Test backward compatibility with existing trips
  - Verify data migration completed successfully
  - Test all features with Thai language UI
  - Review error handling and edge cases
  - Ask the user if questions arise


## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Database migrations (tasks 1-3) must run in sequence and should be tested on staging before production
- The destination migration (1.2) is a critical schema change requiring careful backfill verification
- RLS policies (tasks 4-6) are essential for security and must be tested thoroughly
- Real-time subscriptions (task 23) should target <500ms latency for optimal user experience
- All UI components follow Thai language convention as specified in AGENTS.md
- Mobile-first design principles apply throughout (vertical layouts, bottom sheets, touch-friendly controls)
- Each task references specific requirements for traceability
- Checkpoints (tasks 7, 24, 28) ensure incremental validation
- Edge Function (task 10) requires Supabase project configuration for pg_cron

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["8.1", "8.2", "8.3", "8.4", "9.1", "9.2"] },
    { "id": 5, "tasks": ["10.1", "10.2"] },
    { "id": 6, "tasks": ["11.1", "11.2"] },
    { "id": 7, "tasks": ["12.1", "13.1", "14.1"] },
    { "id": 8, "tasks": ["12.2", "12.3", "13.2", "13.3", "14.2"] },
    { "id": 9, "tasks": ["15.1", "16.1", "17.1", "18.1"] },
    { "id": 10, "tasks": ["15.2", "15.3", "16.2", "17.2", "18.2", "18.3"] },
    { "id": 11, "tasks": ["17.3", "18.4", "18.5"] },
    { "id": 12, "tasks": ["19.1", "20.1", "21.1"] },
    { "id": 13, "tasks": ["19.2", "19.3", "19.4", "20.2", "20.3"] },
    { "id": 14, "tasks": ["22.1", "22.2"] },
    { "id": 15, "tasks": ["23.1", "23.2"] },
    { "id": 16, "tasks": ["25.1", "25.2", "25.3"] },
    { "id": 17, "tasks": ["26.1", "26.2", "26.3", "26.4"] },
    { "id": 18, "tasks": ["27.1", "27.2", "27.3"] }
  ]
}
```
