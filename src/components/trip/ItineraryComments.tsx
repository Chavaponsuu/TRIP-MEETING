'use client'

import { useState } from 'react'
import { ItineraryComment } from '@/types'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'

interface ItineraryCommentsProps {
  itemId: string
  comments?: ItineraryComment[]
  onAddComment: (itemId: string, text: string) => Promise<{ error: string | null }>
}

export function ItineraryComments({ itemId, comments = [], onAddComment }: ItineraryCommentsProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    const { error: err } = await onAddComment(itemId, text)

    setLoading(false)
    if (err) {
      setError(err)
    } else {
      setText('')
    }
  }

  const formatCommentDate = (isoStr: string) => {
    const d = new Date(isoStr)
    return d.toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border mt-3">
      <h4 className="text-xs font-bold text-text-secondary">ความคิดเห็น ({comments.length})</h4>

      {comments.length > 0 && (
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const profile = comment.user
            if (!profile) return null
            return (
              <div key={comment.id} className="flex gap-2 items-start text-xs">
                <MemberAvatar profile={profile} size="sm" />
                <div className="flex-1 bg-gray-50 p-2 rounded-lg min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-foreground truncate">{profile.name}</span>
                    <span className="text-[9px] text-text-secondary whitespace-nowrap">
                      {formatCommentDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="เขียนความคิดเห็น..."
          className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={loading}
          disabled={!text.trim()}
          className="min-h-[32px] px-3 py-1 text-xs"
        >
          ส่ง
        </Button>
      </form>
      {error && <p className="text-[10px] text-red-500 font-semibold">{error}</p>}
    </div>
  )
}
