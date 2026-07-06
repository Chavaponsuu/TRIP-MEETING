'use client'

import { useState } from 'react'
import { Comment } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { formatRelativeTime } from '@/lib/utils'

interface CommentThreadProps {
  tripId: string
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
}

export function CommentThread({ tripId, comments, onCommentAdded }: CommentThreadProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ trip_id: tripId, user_id: user.id, text: text.trim() })
      .select('*, user:profiles(*)')
      .single()

    if (!error && data) {
      onCommentAdded(data)
      setText('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">กระดานคุย</h3>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <Button type="submit" size="sm" loading={loading} disabled={!text.trim()}>
          ส่ง
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-4">
          ยังไม่มีข้อความ เริ่มคุยกันเลย!
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2">
              {comment.user && (
                <MemberAvatar profile={comment.user} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user?.name ?? profile?.name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-0.5 break-words">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
