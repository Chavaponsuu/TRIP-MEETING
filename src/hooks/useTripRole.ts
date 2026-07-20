'use client'

import { useMemo } from 'react'
import { TripRole } from '@/types'
import { useAuth } from './useAuth'
import { useTrip } from './useTrip'

interface UseTripRoleReturn {
  role: TripRole
  isOwner: boolean
  isOrganizer: boolean // owner OR co_organizer
  canEdit: boolean
  canManageMembers: boolean
  canConfirmItems: boolean
  canConfirmDates: boolean
  loading: boolean
}

/**
 * Get the current user's role and permissions for a specific trip
 */
export function useTripRole(tripId: string): UseTripRoleReturn {
  const { user } = useAuth()
  const { trip, loading } = useTrip(tripId)

  const result = useMemo(() => {
    if (!user || !trip) {
      return {
        role: 'member' as TripRole,
        isOwner: false,
        isOrganizer: false,
        canEdit: false,
        canManageMembers: false,
        canConfirmItems: false,
        canConfirmDates: false,
        loading,
      }
    }

    const memberRelation = trip.members?.find((m) => m.user_id === user.id)
    const role = memberRelation?.role || 'member'
    const isOwner = role === 'owner'
    const isOrganizer = role === 'owner' || role === 'co_organizer'

    return {
      role,
      isOwner,
      isOrganizer,
      canEdit: isOrganizer,
      canManageMembers: isOrganizer,
      canConfirmItems: isOrganizer,
      canConfirmDates: isOrganizer,
      loading: false,
    }
  }, [user, trip, loading])

  return result
}
