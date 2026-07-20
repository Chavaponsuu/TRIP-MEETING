/**
 * useMyTrips - Query and realtime subscription for user's trips
 * Groups trips into 3 categories: going, pending, completed
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trip, TripMember, Profile } from '@/types'

export interface GroupedTrips {
  going: Trip[]
  pending: Trip[]
  completed: Trip[]
}

export function useMyTrips(userId: string) {
  const [trips, setTrips] = useState<GroupedTrips>({
    going: [],
    pending: [],
    completed: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTrips = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Get all trip memberships for current user (exclude removed)
      const { data: memberships, error: membersError } = await supabase
        .from('trip_members')
        .select('trip_id, role, rsvp_status')
        .eq('user_id', userId)
        .neq('rsvp_status', 'removed')

      if (membersError) throw membersError
      if (!memberships || memberships.length === 0) {
        setTrips({ going: [], pending: [], completed: [] })
        setLoading(false)
        return
      }

      const tripIds = memberships.map(m => m.trip_id)

      // 2. Fetch all trips with members
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          members:trip_members(
            id,
            trip_id,
            user_id,
            role,
            rsvp_status,
            rsvp_updated_at,
            reminder_sent_at,
            joined_at,
            user:profiles(id, name, avatar_color, created_at)
          )
        `)
        .in('id', tripIds)
        .order('created_at', { ascending: false })

      if (tripsError) throw tripsError

      const allTrips = (tripsData || []) as Trip[]

      // 3. Group trips by category
      const grouped: GroupedTrips = {
        going: [],
        pending: [],
        completed: [],
      }

      for (const trip of allTrips) {
        const userMembership = memberships.find(m => m.trip_id === trip.id)
        if (!userMembership) continue

        // Pending: rsvp_status = 'pending'
        if (userMembership.rsvp_status === 'pending') {
          grouped.pending.push(trip)
        }
        // Completed: trip status = 'completed'
        else if (trip.status === 'completed') {
          grouped.completed.push(trip)
        }
        // Going: rsvp_status = 'going' AND status in ('planning','confirmed','ongoing')
        else if (
          userMembership.rsvp_status === 'going' &&
          ['draft', 'planning', 'confirmed', 'ongoing'].includes(trip.status)
        ) {
          grouped.going.push(trip)
        }
      }

      setTrips(grouped)
    } catch (err) {
      console.error('Error fetching trips:', err)
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()

    // Realtime subscription for trip_members changes
    const channel = supabase
      .channel(`user-trips-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch when user's trip memberships change
          fetchTrips()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        () => {
          // Refetch when any trip status changes
          fetchTrips()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { trips, loading, error, refetch: fetchTrips }
}
