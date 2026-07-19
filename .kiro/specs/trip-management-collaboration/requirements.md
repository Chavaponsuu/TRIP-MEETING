# Requirements Document (v3 — Decisions Finalized)

## Introduction

เอกสารนี้เป็นฉบับแก้ไขจาก requirement เดิม โดยตรวจสอบกับ schema จริงใน Supabase แล้ว หลักการแก้ไข:
- Table/column ที่ **มีอยู่แล้ว** → เปลี่ยนจาก "CREATE" เป็น "EXTEND (ALTER TABLE)" และระบุชัดว่า column ไหนมีอยู่แล้วไม่ต้องแตะ
- Table ที่ **ยังไม่มี** → คงเป็น CREATE ใหม่ตามเดิม
- จุดที่ schema จริงกับ spec เดิม **ขัดกันเชิงโครงสร้าง** (ไม่ใช่แค่ชื่อ column ต่างกัน) → ทำเครื่องหมาย ⚠️ CONFLICT พร้อมทางเลือกและคำแนะนำ

> **การตัดสินใจล่าสุด (v3):** จุดที่เคยเปิดไว้เป็น ⚠️ CONFLICT หรือ Open Decision ใน v2 ปิดครบแล้ว:
> 1. **Destination** → migrate `trips.destination` จาก `text` เป็น `text[]` (array) **ทันทีในเวอร์ชันนี้**
> 2. **ระบบวันที่** → ใช้ `availabilities` ต่อไปเป็นระบบหลัก ไม่สร้าง date poll ใหม่
> 3. **Invite code** → ใช้ `trips.invite_code` เดิมต่อไปตามปกติ
> 4. **`invite_links`** → **ตัดออกจาก scope** ของเวอร์ชันนี้ทั้งหมด (Requirement 4 เดิมถูกถอดออก)

## Schema Reconciliation Summary

| Table | สถานะ | หมายเหตุ |
|---|---|---|
| `trips` | มีอยู่แล้ว | ต้อง ALTER เพิ่ม column; `destination` จะถูก **migrate เป็น array** (ดู Requirement 1) |
| `trip_members` | มีอยู่แล้ว | ต้อง ALTER เพิ่ม role/rsvp |
| `trip_invitations` | มีอยู่แล้ว | ตรงกับ Requirement 6 อยู่แล้วเกือบสมบูรณ์ |
| `availabilities` | มีอยู่แล้ว | ทำหน้าที่แทน date_range poll — **ไม่สร้างระบบใหม่ซ้ำ** (ยืนยันแล้ว) |
| `comments` | มีอยู่แล้ว | เป็น trip-level comment, คนละ scope กับ itinerary_comments |
| `friend_requests`, `profiles` | มีอยู่แล้ว | ไม่เกี่ยวข้องโดยตรง ไม่ต้องแก้ |
| `invite_links` | **ตัดออกจาก scope** | ไม่สร้าง — ใช้ `trips.invite_code` เดิมต่อไป (เดิมคือ Requirement 4 ถูกถอดออกทั้งหมด) |
| `polls`, `poll_options`, `poll_votes` | **ยังไม่มี** | สร้างใหม่ (เฉพาะ single/multi/ranked choice) |
| `itinerary_items` | **ยังไม่มี** | สร้างใหม่ |
| `itinerary_reactions`, `itinerary_comments` | **ยังไม่มี** | สร้างใหม่ |

---

## Requirement 1: Extended Trip Attributes

**User Story:** As a trip organizer, I want to add lifecycle status, confirmed dates, and budget info to a trip, so that I can track planning progress and finalize details.

⚠️ **CONFLICT — Date System:** `trips` มี `month`, `year`, `months (jsonb)` และมี table `availabilities` (per-user day/month/year vote) ทำงานอยู่แล้วเป็นระบบเลือกวันที่แบบ heatmap ไม่ต้องสร้าง `date_range` poll ใหม่ (ดู Requirement 11 ที่แก้ไขแล้ว) `start_date/end_date` ใหม่นี้ใช้สำหรับตอน **confirm วันที่สุดท้าย** เท่านั้น ไม่ใช่ตัวรับโหวต

✅ **RESOLVED — Destination:** `trips.destination` เดิมเป็น `text NOT NULL` (ค่าเดียว) **ตัดสินใจ migrate เป็น `text[]` (array) ทันทีในเวอร์ชันนี้** เพื่อรองรับ multi-destination ตั้งแต่ต้น ไม่เลื่อนเป็น future phase — ดู migration steps ใน AC ด้านล่าง

#### Acceptance Criteria

1. THE Trip_System SHALL ALTER TABLE `trips` ADD COLUMN: `status` (text, default 'draft'), `date_mode` (text, default 'flexible'), `start_date` (date, nullable), `end_date` (date, nullable), `budget` (numeric, nullable), `currency` (text, default 'THB'), `cover_image_url` (text, nullable)
2. THE Trip_System SHALL NOT modify `month`, `year`, `months`, `invite_code` columns — คงไว้ตามเดิม
3. THE Trip_System SHALL constrain `status` to: draft, planning, confirmed, ongoing, completed, cancelled
4. THE Trip_System SHALL constrain `date_mode` to: flexible, fixed
5. WHEN `date_mode` = 'fixed', THE Trip_System SHALL require `start_date` and `end_date` to be non-null
6. THE Trip_System SHALL validate `end_date >= start_date` when both are provided
7. WHEN a date_range vote in `availabilities` is finalized by organizer (see Requirement 13-revised), THE Trip_System SHALL set `start_date`, `end_date`, and `date_mode = 'fixed'` accordingly

#### Destination Migration (`text` → `text[]`)

8. THE Trip_System SHALL ADD a new nullable column `destination_new` (`text[]`) to `trips`
9. THE Trip_System SHALL BACKFILL `destination_new` for every existing row as a single-element array from the current `destination` value, i.e. `destination_new = ARRAY[destination]`
10. THE Trip_System SHALL, after backfill is verified, DROP the old `destination` column and RENAME `destination_new` TO `destination`
11. THE Trip_System SHALL set the new `destination` (`text[]`) column to `NOT NULL` with a CHECK constraint requiring `array_length(destination, 1) >= 1`
12. THE Trip_System SHALL update all application read/write paths (trip create/edit forms, trip list/detail views, search/filter queries) to treat `destination` as an array
13. THE Trip_System SHALL run this migration as a single reversible migration script (add → backfill → verify count matches → drop/rename) and SHALL NOT run it as separate ad-hoc steps against production

---

## Requirement 2: Trip Membership Roles and Permissions

**User Story:** As a trip owner, I want to assign co-organizer roles to trusted members, so that we can share responsibility for managing the trip.

#### Acceptance Criteria

1. THE Trip_System SHALL ALTER TABLE `trip_members` ADD COLUMN `role` (text, default 'member'), constrained to: owner, co_organizer, member
2. THE Trip_System SHALL NOT modify `id`, `trip_id`, `user_id`, `joined_at` — คงไว้ตามเดิม
3. WHEN a trip is created, THE Trip_System SHALL automatically insert a `trip_members` record with `role = 'owner'` for `trips.created_by`
4. THE Trip_System SHALL allow `role IN ('owner','co_organizer')` to update trip details
5. THE Trip_System SHALL allow only `owner` to assign/revoke `co_organizer` role
6. THE Trip_System SHALL prevent removing owner role from the trip creator
7. THE Trip_System SHALL enforce (via trigger or application logic) exactly one owner per trip

---

## Requirement 3: RSVP Status Management

**User Story:** As a trip member, I want to indicate my attendance status, so that organizers know who is definitely coming.

#### Acceptance Criteria

1. THE Trip_System SHALL ALTER TABLE `trip_members` ADD COLUMN `rsvp_status` (text, default 'pending'), constrained to: pending, going, maybe, not_going, removed
2. THE Trip_System SHALL ALTER TABLE `trip_members` ADD COLUMN `rsvp_updated_at` (timestamptz, nullable)
3. WHEN a member updates `rsvp_status`, THE Trip_System SHALL set `rsvp_updated_at = now()`
4. THE Trip_System SHALL allow members to change their own `rsvp_status` at any time
5. THE Trip_System SHALL allow owner/co_organizer to view all members' `rsvp_status`
6. WHEN `rsvp_status = 'removed'`, THE Trip_System SHALL hide the member from active lists but preserve the row

---

## Requirement 4: ~~Invite Link System~~ — OUT OF SCOPE (Removed)

**สถานะ:** ❌ ตัดออกจาก scope ของเวอร์ชันนี้ทั้งหมด

ตัดสินใจใช้ `trips.invite_code` เดิม (1 code ถาวรต่อทริป) เป็นกลไกเชิญเข้าทริปทางเดียวต่อไป ไม่สร้าง table `invite_links` และไม่ implement ระบบ expiry/usage-limit ในเวอร์ชันนี้ หากในอนาคตต้องการ control เพิ่ม (expiry/จำกัดจำนวนคน) ให้เปิดเป็น requirement ใหม่แยกต่างหาก

---

## Requirement 6: In-App Friend Invitation (Already Exists — Minor Extension)

**User Story:** As a trip member, I want to invite friends from my friend list to trips.

✅ `trip_invitations` (trip_id, inviter_id, invitee_id, status, created_at) มีอยู่แล้วและตรงกับ requirement นี้เกือบทั้งหมด ไม่ต้องสร้างใหม่

#### Acceptance Criteria

1. THE Trip_System SHALL verify a unique constraint exists on (`trip_id`, `invitee_id`) in `trip_invitations`; ADD it via migration if missing
2. THE Trip_System SHALL use existing `status` values: pending, accepted, declined (verify constraint matches; ADD CHECK constraint if not present)
3. WHEN invitee accepts, THE Trip_System SHALL INSERT into `trip_members` (with default `role='member'`, `rsvp_status='pending'`) AND UPDATE `trip_invitations.status = 'accepted'`
4. WHEN invitee declines, THE Trip_System SHALL UPDATE `status = 'declined'`
5. THE Trip_System SHALL prevent inviting users already present in `trip_members` (application-level check before insert)
6. THE Trip_System SHALL surface pending `trip_invitations` in the invitee's notification view

---

## Requirement 7: RSVP Reminder System

#### Acceptance Criteria

1. THE Trip_System SHALL ALTER TABLE `trip_members` ADD COLUMN `reminder_sent_at` (timestamptz, nullable)
2. THE Trip_System SHALL provide a function/query to select members where `rsvp_status = 'maybe'`
3. WHEN organizer triggers reminder, THE Trip_System SHALL send in-app notification to all "maybe" members and set `reminder_sent_at = now()`
4. THE Trip_System SHALL prevent re-sending reminder to the same member within 48 hours (check `reminder_sent_at`)

---

## Requirement 8–10: Poll System (New — Choice-Based Only)

**User Story:** As a trip organizer, I want to create polls for choices like accommodation or activities (NOT for dates — dates use the existing `availabilities` system).

⚠️ **Scope change from original spec:** `poll_type` ตัด `date_range` ออก เหลือแค่ single_choice / multi_choice / ranked เพราะ date voting มี `availabilities` ทำอยู่แล้ว

#### Acceptance Criteria

1. THE Trip_System SHALL CREATE TABLE `polls`: id, trip_id, created_by, title, description, poll_type (text: single_choice | multi_choice | ranked), deadline (timestamptz, nullable), allow_vote_changes (boolean, default true), results_visibility (text: live|after_close, default 'live'), status (text: open|closed, default 'open'), created_at
2. THE Trip_System SHALL CREATE TABLE `poll_options`: id, poll_id, option_text, option_data (jsonb, nullable — for image_url/external_link), display_order, vote_count (default 0)
3. THE Trip_System SHALL require at least 2 `poll_options` per poll
4. THE Trip_System SHALL CREATE TABLE `poll_votes`: id, poll_id, user_id, option_id, rank (integer, nullable — used only for ranked polls), created_at, updated_at
5. FOR single_choice polls, THE Trip_System SHALL enforce unique (`poll_id`, `user_id`)
6. FOR multi_choice polls, THE Trip_System SHALL allow multiple rows per user with different `option_id`
7. FOR ranked polls, THE Trip_System SHALL require unique `rank` per user per poll
8. WHEN `allow_vote_changes = true`, THE Trip_System SHALL allow updating/deleting votes before close
9. THE Trip_System SHALL increment/decrement `poll_options.vote_count` on vote insert/delete
10. THE Trip_System SHALL allow only owner/co_organizer to create polls

---

## Requirement 11 (Revised): Date Decisions via Existing `availabilities` Table

**User Story:** As a trip member, I want to mark my available dates so the group can see a heatmap of overlap — using the system already built.

✅ ไม่สร้าง table ใหม่ ใช้ `availabilities` (trip_id, user_id, day, month, year) ที่มีอยู่แล้ว

#### Acceptance Criteria

1. THE Trip_System SHALL continue using `availabilities` for per-user date selection (no schema change required unless a gap is found)
2. THE Trip_System SHALL calculate daily availability counts by aggregating `availabilities` grouped by (day, month, year)
3. THE Trip_System SHALL generate heatmap intensity based on percentage of `trip_members` (active, non-removed) who marked each date
4. THE Trip_System SHALL update heatmap in real-time via Supabase Realtime subscription on `availabilities`
5. IF finer control (deadline, explicit "poll close") is needed for the date decision, THE Trip_System SHALL evaluate ADD COLUMN on `trips` (e.g. `date_decision_deadline`) rather than duplicating a poll table — **flagged for product decision, not yet required**

---

## Requirement 12–13 (Revised): Poll Deadline, Auto-Close, and Trip Date Confirmation

#### Acceptance Criteria

1. WHEN a `polls` row has `deadline` set, THE Trip_System SHALL auto-close it via scheduled Edge Function (applies to choice-based polls only)
2. WHEN `now() >= deadline`, THE Trip_System SHALL set `polls.status = 'closed'` and reject further votes
3. THE Trip_System SHALL run this check every 5 minutes via pg_cron
4. **Date confirmation (replaces old auto-resolve):** WHEN an organizer manually confirms final trip dates (based on `availabilities` heatmap), THE Trip_System SHALL UPDATE `trips.start_date`, `trips.end_date`, `trips.date_mode = 'fixed'`, `trips.status = 'planning'` — this is an explicit organizer action, not an automatic poll-close trigger, since `availabilities` has no deadline/poll concept
5. THE Trip_System SHALL log this confirmation action (trip_id, confirmed_by, confirmed_at, resulting dates)

---

## Requirement 14–17: Itinerary (New Tables — No Conflicts)

#### Acceptance Criteria

1. THE Trip_System SHALL CREATE TABLE `itinerary_items`: id, trip_id, day_number (integer, nullable), item_type (text: travel|food|activity|accommodation|free_time), title, description, start_time (time, nullable), end_time (time, nullable), location (text, nullable), status (text: proposed|confirmed, default 'proposed'), display_order, created_by, created_at
2. THE Trip_System SHALL order items by `day_number`, then `start_time`, then `display_order`
3. THE Trip_System SHALL validate `end_time > start_time` when both provided
4. THE Trip_System SHALL allow any trip member to create items with `status='proposed'`
5. THE Trip_System SHALL allow owner/co_organizer to change status to 'confirmed'
6. THE Trip_System SHALL allow item creator to edit/delete own proposed items; owner/co_organizer can edit/delete any item
7. THE Trip_System SHALL allow owner/co_organizer to reorder `display_order` (drag-and-drop) and move items between days
8. THE Trip_System SHALL enable Supabase Realtime on `itinerary_items` (broadcast insert/update/delete, target <500ms client update)

---

## Requirement 18: Itinerary Reactions & Comments (New — Separate from existing `comments`)

หมายเหตุ: `comments` เดิม (trip_id, user_id, text) เป็น **trip-level discussion** ใช้ต่อไปตามเดิม ส่วนนี้เป็นของใหม่ที่ผูกกับ itinerary item โดยเฉพาะ คนละ use case ไม่รวมกัน

#### Acceptance Criteria

1. THE Trip_System SHALL CREATE TABLE `itinerary_reactions`: id, itinerary_item_id, user_id, reaction_type (text: thumbs_up|heart|fire|thinking|thumbs_down), created_at, unique (itinerary_item_id, user_id, reaction_type)
2. THE Trip_System SHALL CREATE TABLE `itinerary_comments`: id, itinerary_item_id, user_id, text, created_at
3. THE Trip_System SHALL allow any trip member to add/remove own reactions and add comments
4. THE Trip_System SHALL enable Realtime on both tables

---

## Requirement 19: Row Level Security

#### Acceptance Criteria

1. FOR ALL new tables with `trip_id` (directly or via `poll_id`/`itinerary_item_id` join), THE Trip_System SHALL enable RLS checking membership via `trip_members` (active rsvp_status only)
2. THE Trip_System SHALL allow SELECT on `polls`, `poll_options`, `poll_votes`, `itinerary_items`, `itinerary_reactions`, `itinerary_comments` only to trip members
3. THE Trip_System SHALL restrict INSERT on `polls` to `role IN ('owner','co_organizer')`
4. THE Trip_System SHALL allow INSERT on `poll_votes`, `itinerary_items`, `itinerary_reactions`, `itinerary_comments` to any trip member
5. THE Trip_System SHALL allow UPDATE/DELETE on a user's own `poll_votes`, `itinerary_reactions`, `itinerary_comments`
6. THE Trip_System SHALL ALSO review and add RLS policies on existing tables (`trips`, `trip_members`, `trip_invitations`, `availabilities`, `comments`) if not already present, since new columns (role, rsvp_status) affect access logic

---

## Requirement 20–21: Real-Time Sync & Cron

#### Acceptance Criteria

1. THE Trip_System SHALL enable Realtime replication on `poll_votes`, `itinerary_items`, `itinerary_reactions`, `itinerary_comments`, `availabilities`
2. THE Trip_System SHALL create Edge Function `process-poll-deadlines`, invoked every 5 minutes via pg_cron, to auto-close choice-based `polls` past deadline
3. THE Trip_System SHALL log deadline-processing actions (poll_id, action, timestamp) and continue on per-poll error without aborting the batch

---

## Requirement 22–23: Mobile UI & Thai Language (Unchanged)

ไม่มีการเปลี่ยนแปลงจาก spec เดิม — ใช้ vertical timeline บนมือถือ, sticky day headers, bottom sheets สำหรับ create/edit, touch drag-and-drop, และ UI/label ทั้งหมดเป็นภาษาไทยตามที่ระบุไว้เดิม (RSVP labels, trip status labels ฯลฯ)

---

## Decisions Log (Resolved — was "Open Decisions" in v2)

| # | ประเด็น | มติ |
|---|---|---|
| 1 | Multi-destination | Migrate `trips.destination` จาก `text` เป็น `text[]` **ทันทีในเวอร์ชันนี้** (ดู Requirement 1) |
| 2 | `availabilities` vs date poll | ใช้ `availabilities` เป็นระบบ date-decision หลักต่อไป **ไม่สร้าง poll วันที่ใหม่** |
| 3 | `invite_code` vs `invite_links` | ใช้ `trips.invite_code` เดิมต่อไป **ตัด `invite_links` ออกจาก scope** ทั้งหมด (Requirement 4 ถอดออก) |

ไม่มี open decision ค้างสำหรับเวอร์ชันนี้แล้ว พร้อม implement ตาม requirement ด้านบน