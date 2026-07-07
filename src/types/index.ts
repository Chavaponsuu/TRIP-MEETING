export interface Profile {
  id: string
  name: string
  avatar_color: string | null
  created_at: string
}

export interface TripMonth {
  month: number
  year: number
}

export interface Trip {
  id: string
  name: string
  destination: string
  emoji: string
  description?: string
  month: number
  year: number
  months?: TripMonth[]
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
  destination: string
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
