'use client'

import { useState, useEffect } from 'react'
import { Poll, PollOption } from '@/types'
import { PollVoteCard } from './PollVoteCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface PollCardProps {
  poll: Poll
  currentUserId: string
  currentUserRole: 'owner' | 'co_organizer' | 'member'
  onUpdated: () => void
  onVote: (input: { poll_id: string; option_id: string; rank?: number }) => Promise<{ error: string | null }>
  onDelete?: (pollId: string) => Promise<{ error: string | null }>
}

export function PollCard({ poll, currentUserId, currentUserRole, onUpdated, onVote, onDelete }: PollCardProps) {
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  
  const supabase = createClient()
  
  const userVotes = poll.votes?.filter(v => v.user_id === currentUserId) ?? []
  const rankedOptions = [...(poll.options ?? [])].sort((a, b) => b.vote_count - a.vote_count)
  const hasVoted = userVotes.length > 0
  const isClosed = poll.status === 'closed'
  
  const isCreatorOrOrganizer = 
    currentUserRole === 'owner' || 
    currentUserRole === 'co_organizer' || 
    poll.created_by === currentUserId

  // Calculate total votes cast (unique voters)
  const uniqueVoters = new Set(poll.votes?.map(v => v.user_id)).size

  // Results visibility logic
  const showResults = isClosed || (poll.results_visibility === 'live' && hasVoted)

  // Countdown timer for deadline
  useEffect(() => {
    if (!poll.deadline || isClosed) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(poll.deadline!).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining('สิ้นสุดระยะเวลาโหวตแล้ว')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`เหลือเวลาโหวตอีก: ${days} วัน ${hours} ชั่วโมง`)
      } else {
        setTimeRemaining(`เหลือเวลาโหวตอีก: ${hours} ชั่วโมง ${minutes} นาที`)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 60000)
    return () => clearInterval(timer)
  }, [poll.deadline, isClosed])

  const handleClosePoll = async () => {
    if (confirm('คุณต้องการปิดโพลล์นี้ใช่หรือไม่? (จะไม่สามารถเพิ่มโหวตได้อีก)')) {
      setClosing(true)
      const { error } = await supabase
        .from('polls')
        .update({ status: 'closed' })
        .eq('id', poll.id)
      
      setClosing(false)
      if (!error) {
        onUpdated()
      }
    }
  }

  const handleDeletePoll = async () => {
    if (!onDelete) return
    
    if (confirm('คุณต้องการลบโพลล์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      setDeleting(true)
      const { error } = await onDelete(poll.id)
      setDeleting(false)
      
      if (error) {
        alert(error)
      }
    }
  }

  // Format dates
  const formatDeadlineDate = (dStr: string) => {
    const d = new Date(dStr)
    return d.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-foreground">{poll.title}</h3>
            {isClosed ? (
              <Badge variant="default" className="bg-red-50 text-red-600 border border-red-100 font-bold">
                ปิดโหวตแล้ว
              </Badge>
            ) : (
              <Badge variant="primary" className="bg-green-50 text-green-700 border border-green-100 font-bold">
                เปิดโหวตอยู่
              </Badge>
            )}
          </div>
          {poll.description && (
            <p className="text-xs text-text-secondary">{poll.description}</p>
          )}
        </div>

        {isCreatorOrOrganizer && (
          <div className="flex items-center gap-2">
            {!isClosed && (
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                loading={closing}
                onClick={handleClosePoll}
              >
                ปิดโหวต
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                loading={deleting}
                onClick={handleDeletePoll}
              >
                ลบ
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Timer / Metadata info */}
      {(timeRemaining || poll.deadline) && (
        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span>🕒</span>
          <span>
            {timeRemaining || `สิ้นสุดเมื่อ: ${formatDeadlineDate(poll.deadline!)}`}
          </span>
        </div>
      )}

      {/* Voting options UI */}
      <div className="pt-2 border-t border-border">
        {showResults ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-secondary">ผลสรุปคะแนนโหวต (ผู้ร่วมโหวต {uniqueVoters} คน)</h4>
            <div className="space-y-2">
              {rankedOptions.map((opt) => {
                // Calculate percentage
                // For ranked polls, vote_count represents total score or count. We can show raw score/count.
                const totalOptionsVotes = poll.options?.reduce((sum, o) => sum + o.vote_count, 0) || 0
                const percent = totalOptionsVotes > 0 ? Math.round((opt.vote_count / totalOptionsVotes) * 100) : 0
                const isUserChoice = userVotes.some(v => v.option_id === opt.id)

                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground flex items-center gap-1">
                        {opt.option_text} {isUserChoice && <span className="text-primary text-[10px]">(คุณเลือก)</span>}
                      </span>
                      <span className="text-text-secondary">{opt.vote_count} คะแนน ({percent}%)</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                         className={`h-full rounded-full transition-all duration-300 ${
                          isUserChoice ? 'bg-primary' : 'bg-gray-400'
                        }`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* If open, allow changing vote */}
            {!isClosed && poll.allow_vote_changes && (
              <div className="pt-3 border-t border-border mt-3 text-center">
                <PollVoteCard poll={poll} currentUserId={currentUserId} onVoted={onUpdated} onVote={onVote} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <PollVoteCard poll={poll} currentUserId={currentUserId} onVoted={onUpdated} onVote={onVote} />
            {!isClosed && poll.results_visibility === 'after_close' && (
              <p className="text-[10px] text-text-secondary text-center italic bg-slate-50 p-2 rounded-lg">
                👁️ ผลโหวตถูกซ่อนอยู่และจะแสดงเมื่อโพลล์ปิดโหวตแล้วเท่านั้น
              </p>
            )}
          </div>
        )}
      </div>

      {/* Creator Info */}
      <div className="flex items-center justify-between text-[10px] text-text-secondary pt-2 border-t border-border">
        <span>สร้างโดย: {poll.creator?.name || 'สมาชิก'}</span>
        <span>{new Date(poll.created_at).toLocaleDateString('th-TH')}</span>
      </div>
    </div>
  )
}
