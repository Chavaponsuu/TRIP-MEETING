'use client'

import { useState, useEffect } from 'react'
import { Poll, PollOption, PollVote } from '@/types'
import { usePolls } from '@/hooks/usePolls'
import { Button } from '@/components/ui/Button'

interface PollVoteCardProps {
  poll: Poll
  currentUserId: string
  onVoted: () => void
}

export function PollVoteCard({ poll, currentUserId, onVoted }: PollVoteCardProps) {
  const { vote, getUserVotes } = usePolls(poll.trip_id)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Track ranked list order state locally before submission
  const [rankedOptions, setRankedOptions] = useState<PollOption[]>([])

  const userVotes = getUserVotes(poll.id, currentUserId)
  const hasVoted = userVotes.length > 0
  const isClosed = poll.status === 'closed'
  const canVote = !isClosed && (poll.allow_vote_changes || !hasVoted)

  // Initialize ranked choices order (either user's existing ranks or display order)
  useEffect(() => {
    if (poll.poll_type === 'ranked') {
      const sorted = [...(poll.options ?? [])].sort((a, b) => {
        const voteA = userVotes.find(v => v.option_id === a.id)
        const voteB = userVotes.find(v => v.option_id === b.id)
        if (voteA && voteB) return (voteA.rank ?? 99) - (voteB.rank ?? 99)
        if (voteA) return -1
        if (voteB) return 1
        return a.display_order - b.display_order
      })
      setRankedOptions(sorted)
    }
  }, [poll, userVotes])

  const handleSingleVote = async (optionId: string) => {
    if (!canVote) return
    setError(null)
    setSubmitting(true)
    const { error: err } = await vote({ poll_id: poll.id, option_id: optionId })
    setSubmitting(false)
    if (err) setError(err)
    else onVoted()
  }

  const handleMultiVote = async (optionId: string) => {
    if (!canVote) return
    setError(null)
    setSubmitting(true)
    const { error: err } = await vote({ poll_id: poll.id, option_id: optionId })
    setSubmitting(false)
    if (err) setError(err)
    else onVoted()
  }

  // Move option up/down in ranked choices list
  const moveRankedOption = (index: number, direction: 'up' | 'down') => {
    if (!canVote) return
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= rankedOptions.length) return

    const updated = [...rankedOptions]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setRankedOptions(updated)
  }

  // Submit ranked choice positions
  const handleSubmitRanked = async () => {
    if (!canVote) return
    setError(null)
    setSubmitting(false)

    // Submit ranks for all options sequentially
    for (let i = 0; i < rankedOptions.length; i++) {
      const option = rankedOptions[i]
      const { error: err } = await vote({
        poll_id: poll.id,
        option_id: option.id,
        rank: i + 1 // Rank is 1-indexed (1 = top choice)
      })
      if (err) {
        setError(err)
        return
      }
    }
    onVoted()
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Single Choice (Radio UI) */}
      {poll.poll_type === 'single_choice' && (
        <div className="space-y-2">
          {poll.options?.map((opt) => {
            const isChecked = userVotes.some(v => v.option_id === opt.id)
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isChecked
                    ? 'border-primary bg-indigo-50/20 font-semibold'
                    : 'border-border hover:bg-gray-50'
                } ${!canVote ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  checked={isChecked}
                  disabled={!canVote || submitting}
                  onChange={() => handleSingleVote(opt.id)}
                  className="text-primary focus:ring-primary/20 w-4.5 h-4.5"
                />
                <span className="text-sm text-foreground">{opt.option_text}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* 2. Multiple Choice (Checkbox UI) */}
      {poll.poll_type === 'multi_choice' && (
        <div className="space-y-2">
          {poll.options?.map((opt) => {
            const isChecked = userVotes.some(v => v.option_id === opt.id)
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isChecked
                    ? 'border-primary bg-indigo-50/20 font-semibold'
                    : 'border-border hover:bg-gray-50'
                } ${!canVote ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={!canVote || submitting}
                  onChange={() => handleMultiVote(opt.id)}
                  className="rounded border-border text-primary focus:ring-primary/20 w-4.5 h-4.5"
                />
                <span className="text-sm text-foreground">{opt.option_text}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* 3. Ranked Choice (Reorder UI) */}
      {poll.poll_type === 'ranked' && (
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            กดปุ่ม 🔼 หรือ 🔽 เพื่อเรียงลำดับที่คุณชอบจากมากไปน้อย (ลำดับ 1 คือชอบมากที่สุด)
          </p>
          <div className="space-y-2">
            {rankedOptions.map((opt, idx) => (
              <div
                key={opt.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary bg-indigo-50 w-6 h-6 flex items-center justify-center rounded-full">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground font-medium">{opt.option_text}</span>
                </div>

                {canVote && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveRankedOption(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 border border-border hover:bg-gray-100 disabled:opacity-30 rounded transition-colors text-xs"
                      title="เลื่อนขึ้น"
                    >
                      🔼
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRankedOption(idx, 'down')}
                      disabled={idx === rankedOptions.length - 1}
                      className="p-1.5 border border-border hover:bg-gray-100 disabled:opacity-30 rounded transition-colors text-xs"
                      title="เลื่อนลง"
                    >
                      🔽
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {canVote && (
            <Button
              variant="primary"
              className="w-full mt-2"
              loading={submitting}
              onClick={handleSubmitRanked}
            >
              บันทึกการจัดอันดับโหวต
            </Button>
          )}
        </div>
      )}

      {!poll.allow_vote_changes && hasVoted && !isClosed && (
        <p className="text-[10px] text-text-secondary text-center">
          🔒 โพลล์นี้ไม่ยอมรับให้ปรับเปลี่ยนคำตอบหลังโหวต
        </p>
      )}
    </div>
  )
}
