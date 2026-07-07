'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, Comment } from '@/types'

export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const channelId = useRef(`trip-${tripId}-${Math.random().toString(36).slice(2, 8)}`)

  const refetchAvailabilities = useCallback(async () => {
    const { data } = await supabase
      .from('availabilities')
      .select('*, month, year, user:profiles(*)')
      .eq('trip_id', tripId)

    if (data) {
      setTrip(prev => prev ? { ...prev, availabilities: data } : prev)
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

  const fetchTrip = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('trips')
      .select(`
        *,
        members:trip_members(
          id, trip_id, user_id, joined_at,
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
      const sortedComments = (data.comments ?? []).sort(
        (a: Comment, b: Comment) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setTrip({ ...data, comments: sortedComments })
    }
    setLoading(false)
  }, [tripId, supabase])

  // Keep refs so realtime callbacks always use the latest versions
  // without being listed as effect dependencies.
  const refetchAvailabilitiesRef = useRef(refetchAvailabilities)
  const appendCommentRef = useRef(appendComment)
  useEffect(() => { refetchAvailabilitiesRef.current = refetchAvailabilities }, [refetchAvailabilities])
  useEffect(() => { appendCommentRef.current = appendComment }, [appendComment])

  // Initial load
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

  // Realtime subscription — single channel, built once per tripId
  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availabilities', filter: `trip_id=eq.${tripId}` },
        () => refetchAvailabilitiesRef.current()
      )
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
