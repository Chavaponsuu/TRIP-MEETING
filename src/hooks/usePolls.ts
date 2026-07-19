'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Poll, PollOption, PollVote, PollType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatePollInput {
  title: string
  description?: string
  poll_type: PollType
  options: string[]           // option_text values — minimum 2
  deadline?: string | null    // ISO timestamp or null
  allow_vote_changes?: boolean
  results_visibility?: 'live' | 'after_close'
}

interface VoteInput {
  poll_id: string
  option_id: string
  rank?: number               // required for ranked polls
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePolls(tripId: string) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const channelId = useRef(`polls-${tripId}-${Math.random().toString(36).slice(2, 8)}`)

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPolls = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('polls')
      .select(`
        id, trip_id, created_by, title, description,
        poll_type, deadline, allow_vote_changes,
        results_visibility, status, created_at, updated_at,
        options:poll_options(
          id, poll_id, option_text, option_data,
          display_order, vote_count, created_at
        ),
        votes:poll_votes(
          id, poll_id, user_id, option_id, rank,
          created_at, updated_at,
          user:profiles(id, name, avatar_color)
        ),
        creator:profiles!polls_created_by_fkey(id, name, avatar_color)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('โหลดโพลล์ไม่สำเร็จ')
      setLoading(false)
      return
    }

    setPolls((data ?? []) as unknown as Poll[])
    setLoading(false)
  }, [tripId, supabase])

  // Keep stable ref for realtime callback
  const fetchPollsRef = useRef(fetchPolls)
  useEffect(() => { fetchPollsRef.current = fetchPolls }, [fetchPolls])

  // ─── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchPolls()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // ─── Realtime subscription ───────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      // Poll created, updated (status change), or deleted
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `trip_id=eq.${tripId}` },
        () => fetchPollsRef.current()
      )
      // Vote cast, changed, or retracted — refetch to recompute vote_counts + user votes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        () => fetchPollsRef.current()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // ─── Mutations ───────────────────────────────────────────────────────────────

  /**
   * Create a new poll with at least 2 options.
   * Options are inserted after the poll row in the same logical transaction
   * (sequential inserts — Supabase does not expose SQL transactions from the client).
   */
  const createPoll = useCallback(async (input: CreatePollInput): Promise<{ data: Poll | null; error: string | null }> => {
    if (input.options.length < 2) {
      return { data: null, error: 'โพลล์ต้องมีตัวเลือกอย่างน้อย 2 ข้อ' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'กรุณาเข้าสู่ระบบก่อนสร้างโพลล์' }
    }

    // 1. Insert the poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        trip_id: tripId,
        created_by: user.id,
        title: input.title,
        description: input.description ?? null,
        poll_type: input.poll_type,
        deadline: input.deadline ?? null,
        allow_vote_changes: input.allow_vote_changes ?? true,
        results_visibility: input.results_visibility ?? 'live',
        status: 'open',
      })
      .select('id')
      .single()

    if (pollError || !pollData) {
      return { data: null, error: 'สร้างโพลล์ไม่สำเร็จ' }
    }

    // 2. Insert options
    const optionRows = input.options.map((text, idx) => ({
      poll_id: pollData.id,
      option_text: text,
      display_order: idx,
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionRows)

    if (optionsError) {
      // Best-effort cleanup — delete the orphaned poll
      await supabase.from('polls').delete().eq('id', pollData.id)
      return { data: null, error: 'บันทึกตัวเลือกโพลล์ไม่สำเร็จ' }
    }

    // Refetch to return the full poll with options
    await fetchPolls()
    const created = polls.find(p => p.id === pollData.id) ?? null
    return { data: created, error: null }
  }, [tripId, supabase, fetchPolls, polls])

  /**
   * Cast or update a vote.
   *
   * - single_choice: upsert the single row (poll_id, user_id) → replaces previous option
   * - multi_choice:  insert if not already voted for that option; delete to retract
   * - ranked:        upsert with the given rank value
   */
  const vote = useCallback(async (input: VoteInput): Promise<{ error: string | null }> => {
    const targetPoll = polls.find(p => p.id === input.poll_id)

    if (!targetPoll) {
      return { error: 'ไม่พบโพลล์' }
    }
    if (targetPoll.status === 'closed') {
      return { error: 'โพลล์นี้ปิดแล้ว ไม่สามารถโหวตได้' }
    }

    const { poll_type, allow_vote_changes, votes = [] } = targetPoll

    // Check current user's existing vote on this option (requires auth state)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อนโหวต' }

    const existingVoteForOption = votes.find(
      (v: PollVote) => v.user_id === user.id && v.option_id === input.option_id
    )

    // ── single_choice ─────────────────────────────────────────────────────────
    if (poll_type === 'single_choice') {
      const existingVote = votes.find((v: PollVote) => v.user_id === user.id)

      if (existingVote && !allow_vote_changes) {
        return { error: 'โพลล์นี้ไม่อนุญาตให้เปลี่ยนคำตอบ' }
      }

      if (existingVote) {
        const { error: updateError } = await supabase
          .from('poll_votes')
          .update({ option_id: input.option_id })
          .eq('id', existingVote.id)

        if (updateError) return { error: 'โหวตไม่สำเร็จ' }
      } else {
        const { error: insertError } = await supabase
          .from('poll_votes')
          .insert({ poll_id: input.poll_id, user_id: user.id, option_id: input.option_id })

        if (insertError) return { error: 'โหวตไม่สำเร็จ' }
      }

      await fetchPolls()
      return { error: null }
    }

    // ── multi_choice ──────────────────────────────────────────────────────────
    if (poll_type === 'multi_choice') {
      if (existingVoteForOption) {
        if (!allow_vote_changes) return { error: 'โพลล์นี้ไม่อนุญาตให้เปลี่ยนคำตอบ' }
        const { error: deleteError } = await supabase
          .from('poll_votes')
          .delete()
          .eq('id', existingVoteForOption.id)

        if (deleteError) return { error: 'ยกเลิกโหวตไม่สำเร็จ' }
      } else {
        const { error: insertError } = await supabase
          .from('poll_votes')
          .insert({ poll_id: input.poll_id, user_id: user.id, option_id: input.option_id })

        if (insertError) return { error: 'โหวตไม่สำเร็จ' }
      }

      await fetchPolls()
      return { error: null }
    }

    // ── ranked ────────────────────────────────────────────────────────────────
    if (poll_type === 'ranked') {
      if (input.rank === undefined || input.rank === null) {
        return { error: 'โพลล์แบบจัดอันดับต้องระบุลำดับ' }
      }

      if (existingVoteForOption) {
        const { error: updateError } = await supabase
          .from('poll_votes')
          .update({ rank: input.rank })
          .eq('id', existingVoteForOption.id)

        if (updateError) return { error: 'อัปเดตอันดับไม่สำเร็จ' }
      } else {
        const { error: insertError } = await supabase
          .from('poll_votes')
          .insert({ poll_id: input.poll_id, user_id: user.id, option_id: input.option_id, rank: input.rank })

        if (insertError) return { error: 'โหวตไม่สำเร็จ' }
      }

      await fetchPolls()
      return { error: null }
    }

    return { error: 'ประเภทโพลล์ไม่รองรับ' }
  }, [polls, supabase])

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Get all votes cast by the current user for a given poll.
   * Useful for rendering the current selection state in the UI.
   */
  const getUserVotes = useCallback((pollId: string, userId: string): PollVote[] => {
    const poll = polls.find(p => p.id === pollId)
    return (poll?.votes ?? []).filter((v: PollVote) => v.user_id === userId)
  }, [polls])

  /**
   * Get vote options sorted by vote_count descending (for results display).
   */
  const getRankedOptions = useCallback((pollId: string): PollOption[] => {
    const poll = polls.find(p => p.id === pollId)
    return [...(poll?.options ?? [])].sort((a, b) => b.vote_count - a.vote_count)
  }, [polls])

  return {
    polls,
    loading,
    error,
    refetch: fetchPolls,
    createPoll,
    vote,
    getUserVotes,
    getRankedOptions,
  }
}
