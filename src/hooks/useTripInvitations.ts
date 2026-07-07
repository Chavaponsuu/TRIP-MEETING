'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TripInvitation } from '@/types'

export function useTripInvitations(userId: string | undefined) {
  const [invitations, setInvitations] = useState<TripInvitation[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  const channelId = useRef(`trip-invites-${userId ?? 'anon'}-${Math.random().toString(36).slice(2, 8)}`)
  const fetchRef = useRef<() => Promise<void>>(async () => {})

  const fetchInvitations = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('trip_invitations')
      .select(`
        *,
        inviter:inviter_id(id, name, avatar_color, created_at),
        trip:trips(id, name, emoji, destination)
      `)
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch trip invitations:', error)
      return
    }

    console.log('Raw trip invitations data:', data)
    setInvitations((data ?? []) as unknown as TripInvitation[])
  }, [userId, supabase])

  useEffect(() => { fetchRef.current = fetchInvitations }, [fetchInvitations])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    fetchInvitations().then(() => {
      if (!cancelled) setLoading(false)
    })

    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_invitations' },
        () => fetchRef.current()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    const invitation = invitations.find(i => i.id === invitationId)
    if (!invitation || !userId) return { error: 'Invitation not found' }

    const { error: updateError } = await supabase
      .from('trip_invitations')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', invitationId)

    if (updateError) return { error: updateError.message }

    if (accept) {
      const { error: joinError } = await supabase.from('trip_members').insert({
        trip_id: invitation.trip_id,
        user_id: userId,
      })
      if (joinError) return { error: joinError.message }
    }

    await fetchInvitations()
    return { error: null, tripId: accept ? invitation.trip_id : undefined }
  }

  return {
    invitations,
    loading: userId ? loading : false,
    respondToInvitation,
    refetch: fetchInvitations,
    pendingCount: invitations.length,
  }
}

export function useTripFriendInvites(tripId: string, userId: string | undefined, memberIds: string[]) {
  const [sentInvites, setSentInvites] = useState<TripInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchSentInvites = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('trip_invitations')
      .select(`
        *,
        invitee:invitee_id(id, name, avatar_color, created_at)
      `)
      .eq('trip_id', tripId)
      .eq('status', 'pending')

    if (error) {
      console.error('Failed to fetch sent invites:', error)
      return
    }

    console.log('Raw sent invites data:', data)
    setSentInvites((data ?? []) as unknown as TripInvitation[])
  }, [tripId, userId, supabase])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    fetchSentInvites().then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tripId])

  const inviteFriend = async (friendId: string) => {
    if (!userId) return { error: 'Not authenticated' }
    if (memberIds.includes(friendId)) return { error: 'Already a member' }
    if (sentInvites.some(i => i.invitee_id === friendId)) return { error: 'Already invited' }

    setSending(true)
    const { error } = await supabase.from('trip_invitations').insert({
      trip_id: tripId,
      inviter_id: userId,
      invitee_id: friendId,
    })
    setSending(false)

    if (!error) await fetchSentInvites()
    return { error: error?.message }
  }

  return {
    sentInvites,
    pendingInviteeIds: sentInvites.map(i => i.invitee_id),
    loading: userId ? loading : false,
    sending,
    inviteFriend,
    refetch: fetchSentInvites,
  }
}
