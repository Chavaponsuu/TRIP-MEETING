'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FriendRequest, Profile } from '@/types'

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Profile[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Stable client — created once, never triggers re-renders
  const supabase = useMemo(() => createClient(), [])

  // Unique channel name per hook instance — prevents collisions when
  // multiple components call useFriends() for the same userId simultaneously.
  const channelId = useRef(`friends-${userId ?? 'anon'}-${Math.random().toString(36).slice(2, 8)}`)

  // Keep fetchFriends in a ref so the realtime callback always calls the
  // latest version without needing to be listed as a channel dependency.
  const fetchFriendsRef = useRef<() => Promise<void>>(async () => {})

  const fetchFriends = useCallback(async () => {
    if (!userId) return

    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:sender_id(id, name, avatar_color, created_at),
        receiver:receiver_id(id, name, avatar_color, created_at)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch friends:', error)
      return
    }

    console.log('Raw friend requests data:', requests)

    const all = (requests ?? []) as unknown as FriendRequest[]
    const accepted = all.filter(r => r.status === 'accepted')
    const incoming = all.filter(r => r.status === 'pending' && r.receiver_id === userId)
    const outgoing = all.filter(r => r.status === 'pending' && r.sender_id === userId)

    console.log('Incoming requests:', incoming)
    console.log('Outgoing requests:', outgoing)

    const friendProfiles: Profile[] = accepted.map(r =>
      r.sender_id === userId ? r.receiver! : r.sender!
    ).filter(Boolean)

    setFriends(friendProfiles)
    setIncomingRequests(incoming)
    setOutgoingRequests(outgoing)
  }, [userId, supabase])

  // Keep ref in sync with the latest callback
  useEffect(() => {
    fetchFriendsRef.current = fetchFriends
  }, [fetchFriends])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    fetchFriends().then(() => {
      if (!cancelled) setLoading(false)
    })

    // Build + subscribe in one chain — no .on() calls after .subscribe()
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => fetchFriendsRef.current()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  // Only re-run when userId changes — supabase is stable, fetchFriends is
  // kept current via the ref so it doesn't need to be a dep here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const sendRequest = async (receiverId: string) => {
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: userId,
      receiver_id: receiverId,
    })
    if (!error) await fetchFriends()
    return { error: error?.message }
  }

  const respondToRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId)
    if (!error) await fetchFriends()
    return { error: error?.message }
  }

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
    if (!error) await fetchFriends()
    return { error: error?.message }
  }

  const searchProfiles = async (query: string): Promise<Profile[]> => {
    if (query.trim().length < 2) return []
    const { data, error } = await supabase.rpc('search_profiles', {
      search_query: query.trim(),
    })
    if (error) {
      console.error('Search failed:', error)
      return []
    }
    return (data ?? []) as Profile[]
  }

  const getRelationship = (profileId: string): 'friend' | 'pending_sent' | 'pending_received' | 'none' => {
    if (friends.some(f => f.id === profileId)) return 'friend'
    if (outgoingRequests.some(r => r.receiver_id === profileId)) return 'pending_sent'
    if (incomingRequests.some(r => r.sender_id === profileId)) return 'pending_received'
    return 'none'
  }

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    sendRequest,
    respondToRequest,
    cancelRequest,
    searchProfiles,
    getRelationship,
    refetch: fetchFriends,
  }
}
