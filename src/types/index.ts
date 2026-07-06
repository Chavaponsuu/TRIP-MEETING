export interface Profile {
  id: string
  name: string
  avatar_color: string
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
  user?: Profile
}

export interface Availability {
  id: string
  trip_id: string
  user_id: string
  day: number
  month: number
  year: number
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
