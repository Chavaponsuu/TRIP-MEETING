'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripMember, Comment } from '@/types'

export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const channelId = useRef(`trip-${tripId}-${Math.random().toString(36).slice(2, 8)}`)

  // ─── Refetch helpers ──────────────────────────────────────────────────────

  const refetchAvailabilities = useCallback(async () => {
    const { data } = await supabase
      .from('availabilities')
      .select('*, month, year, user:profiles(*)')
      .eq('trip_id', tripId)

    if (data) {
      setTrip(prev => prev ? { ...prev, availabilities: data } : prev)
    }
  }, [tripId, supabase])

  const refetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('trip_members')
      .select(`
        id, trip_id, user_id, joined_at,
        role, rsvp_status, rsvp_updated_at, reminder_sent_at,
        user:profiles(*)
      `)
      .eq('trip_id', tripId)

    if (data) {
      setTrip(prev => prev ? { ...prev, members: data as unknown as TripMember[] } : prev)
    }
  }, [tripId, supabase])

  const appendComment = useCallback((comment: Comment) => {
    setTrip(prev => {
      if (!prev) return prev
      const exists = prev.comments?.some(c => c.id === comment.id)
      if (exists) return prev
      return { ...prev, comments: [...(prev.comments ?? []), comment] }
    })
  }, [])

  // ─── Full trip fetch ──────────────────────────────────────────────────────

  const fetchTrip = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('trips')
      .select(`
        id, name, destination, emoji, description,
        month, year, months,
        status, date_mode, start_date, end_date,
        budget, currency, cover_image_url,
        created_by, invite_code, created_at,
        members:trip_members(
          id, trip_id, user_id, joined_at,
          role, rsvp_status, rsvp_updated_at, reminder_sent_at,
          user:profiles(*)
        ),
        availabilities(
          id, trip_id, user_id, day, month, year,
          user:profiles(*)
        ),
        comments(
          id, trip_id, user_id, text, created_at,
          user:profiles(*)
        )
      `)
      .eq('id', tripId)
      .single()

    if (fetchError) {
      setError('ไม่พบทริปนี้')
      setLoading(false)
      return
    }

    if (data) {
      const rawTrip = data as any
      const sortedComments = (rawTrip.comments ?? []).sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setTrip({ ...rawTrip, comments: sortedComments } as Trip)
    }
    setLoading(false)
  }, [tripId, supabase])

  // ─── Stable refs for realtime callbacks ──────────────────────────────────

  const refetchAvailabilitiesRef = useRef(refetchAvailabilities)
  const refetchMembersRef = useRef(refetchMembers)
  const appendCommentRef = useRef(appendComment)
  const fetchTripRef = useRef(fetchTrip)

  useEffect(() => { refetchAvailabilitiesRef.current = refetchAvailabilities }, [refetchAvailabilities])
  useEffect(() => { refetchMembersRef.current = refetchMembers }, [refetchMembers])
  useEffect(() => { appendCommentRef.current = appendComment }, [appendComment])
  useEffect(() => { fetchTripRef.current = fetchTrip }, [fetchTrip])

  // ─── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchTrip().then(() => {
      if (cancelled) return
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // ─── Realtime subscriptions ───────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      // Trip row updated (status, dates, budget, etc.)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        () => fetchTripRef.current()
      )
      // Member role / RSVP changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` },
        () => refetchMembersRef.current()
      )
      // Availability changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availabilities', filter: `trip_id=eq.${tripId}` },
        () => refetchAvailabilitiesRef.current()
      )
      // New comments
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const newComment = payload.new as Comment
          const { data } = await supabase
            .from('comments')
            .select('*, user:profiles(*)')
            .eq('id', newComment.id)
            .single()
          if (data) appendCommentRef.current(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  return { trip, loading, error, refetch: fetchTrip, appendComment }
}
