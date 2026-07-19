'use client'

import { useState } from 'react'
import { ItineraryReaction, ReactionType } from '@/types'

interface ItineraryReactionsProps {
  itemId: string
  reactions?: ItineraryReaction[]
  currentUserId: string
  onAddReaction: (itemId: string, type: ReactionType) => Promise<{ error: string | null }>
  onRemoveReaction: (itemId: string) => Promise<{ error: string | null }>
}

const REACTION_EMOJIS: { type: ReactionType; emoji: string }[] = [
  { type: 'thumbs_up', emoji: '👍' },
  { type: 'heart', emoji: '❤️' },
  { type: 'fire', emoji: '🔥' },
  { type: 'thinking', emoji: '🤔' },
  { type: 'thumbs_down', emoji: '👎' }
]

export function ItineraryReactions({ itemId, reactions = [], currentUserId, onAddReaction, onRemoveReaction }: ItineraryReactionsProps) {
  const [submitting, setSubmitting] = useState(false)

  // Group reactions by type
  const reactionGroups = reactions.reduce((acc, curr) => {
    acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1
    return acc
  }, {} as Record<ReactionType, number>)

  // Find user's active reaction (if any)
  const userReaction = reactions.find(r => r.user_id === currentUserId)

  const handleToggleReaction = async (type: ReactionType) => {
    if (submitting) return
    setSubmitting(true)

    if (userReaction?.reaction_type === type) {
      // Toggle off
      await onRemoveReaction(itemId)
    } else {
      // Upsert/Add new
      await onAddReaction(itemId, type)
    }

    setSubmitting(false)
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {REACTION_EMOJIS.map(({ type, emoji }) => {
        const count = reactionGroups[type] || 0
        const isActive = userReaction?.reaction_type === type

        return (
          <button
            key={type}
            onClick={() => handleToggleReaction(type)}
            disabled={submitting}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all duration-150 active:scale-95 ${
              isActive
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-white border-border text-text-secondary hover:bg-gray-50'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
