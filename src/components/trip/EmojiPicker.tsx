'use client'

import { TRIP_EMOJIS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">เลือก emoji</p>
      <div className="grid grid-cols-8 gap-2">
        {TRIP_EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              'text-2xl p-2 rounded-lg transition-all duration-150',
              'hover:bg-indigo-50 hover:scale-110',
              value === emoji && 'bg-indigo-100 ring-2 ring-primary scale-110'
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
