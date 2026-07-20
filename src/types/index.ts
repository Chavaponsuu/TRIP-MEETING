export interface Profile {
  id: string
  name: string
  avatar_color: string | null
  created_at: string
  onboarded_at?: string | null
}

export interface TripMonth {
  month: number
  year: number
}

// ─── Trip Status & Date Mode ────────────────────────────────────────────────
export type TripStatus = 'draft' | 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled'
export type DateMode = 'flexible' | 'fixed'

export interface Trip {
  id: string
  name: string
  /** Multi-destination support (migrated from string → string[]) */
  destination: string[]
  emoji: string
  description?: string
  month: number
  year: number
  months?: TripMonth[]
  // Lifecycle status
  status: TripStatus
  // Date planning
  date_mode: DateMode
  start_date?: string | null   // ISO date string (YYYY-MM-DD), set when date_mode='fixed'
  end_date?: string | null     // ISO date string, must be >= start_date
  // Budget
  budget?: number | null
  currency: string             // Default 'THB'
  // Cover image
  cover_image_url?: string | null
  created_by: string
  invite_code: string
  created_at: string
  members?: TripMember[]
  availabilities?: Availability[]
  comments?: Comment[]
}

// ─── Trip Member Roles & RSVP ────────────────────────────────────────────────
export type TripRole = 'owner' | 'co_organizer' | 'member'
export type RSVPStatus = 'pending' | 'going' | 'maybe' | 'not_going' | 'removed'

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: TripRole
  rsvp_status: RSVPStatus
  rsvp_updated_at?: string | null
  reminder_sent_at?: string | null
  joined_at: string
  user?: Profile | null
}

export interface Availability {
  id: string
  trip_id: string
  user_id: string
  day: number
  month: number
  year: number
  user?: Profile | null
}

export interface Comment {
  id: string
  trip_id: string
  user_id: string
  text: string
  created_at: string
  user?: Profile | null
}

export interface DayAvailability {
  day: number
  month: number
  year: number
  count: number
  users: Profile[]
}

export interface TripInvitePreview {
  id: string
  name: string
  destination: string[]
  emoji: string
  month: number
  year: number
  months?: TripMonth[]
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: Profile | null
  receiver?: Profile | null
}

export interface TripInvitation {
  id: string
  trip_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  inviter?: Profile | null
  invitee?: Profile | null
  trip?: Pick<Trip, 'id' | 'name' | 'emoji' | 'destination'>
}

// ─── Polls ────────────────────────────────────────────────────────────────────
export type PollType = 'single_choice' | 'multi_choice' | 'ranked'
export type PollStatus = 'open' | 'closed'
export type PollResultsVisibility = 'live' | 'after_close'

export interface Poll {
  id: string
  trip_id: string
  created_by: string
  title: string
  description?: string | null
  poll_type: PollType
  deadline?: string | null       // ISO timestamp string
  allow_vote_changes: boolean
  results_visibility: PollResultsVisibility
  status: PollStatus
  created_at: string
  updated_at: string
  // Relations
  options?: PollOption[]
  votes?: PollVote[]
  creator?: Profile | null
}

export interface PollOptionData {
  image_url?: string
  external_link?: string
  metadata?: Record<string, unknown>
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  option_data?: PollOptionData | null
  display_order: number
  vote_count: number
  created_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_id: string
  /** Rank position for ranked polls (1 = top choice). Null for non-ranked polls. */
  rank?: number | null
  created_at: string
  updated_at: string
  // Relations
  user?: Profile | null
  option?: PollOption | null
}

// ─── Itinerary ────────────────────────────────────────────────────────────────
export type ItineraryItemType = 'travel' | 'food' | 'activity' | 'accommodation' | 'free_time'
export type ItineraryItemStatus = 'proposed' | 'confirmed'
export type ReactionType = 'thumbs_up' | 'heart' | 'fire' | 'thinking' | 'thumbs_down'

export interface ItineraryItem {
  id: string
  trip_id: string
  /** Day of the trip (1 = first day). Null means unscheduled. */
  day_number?: number | null
  item_type: ItineraryItemType
  title: string
  description?: string | null
  /** Start time in HH:MM 24-hour format */
  start_time?: string | null
  /** End time in HH:MM 24-hour format. Must be > start_time when both set. */
  end_time?: string | null
  location?: string | null
  status: ItineraryItemStatus
  display_order: number
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  creator?: Profile | null
  reactions?: ItineraryReaction[]
  comments?: ItineraryComment[]
}

export interface ItineraryReaction {
  id: string
  itinerary_item_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
  // Relations
  user?: Profile | null
}

export interface ItineraryComment {
  id: string
  itinerary_item_id: string
  user_id: string
  text: string
  created_at: string
  // Relations
  user?: Profile | null
}
