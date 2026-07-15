'use client'

import { Trip, ItineraryItem, ReactionType, ItineraryItemStatus } from '@/types'
import { ItineraryItemCard } from './ItineraryItemCard'

interface ItineraryTimelineProps {
  trip: Trip
  items: ItineraryItem[]
  currentUserId: string
  currentUserRole: 'owner' | 'co_organizer' | 'member'
  onAddReaction: (itemId: string, type: ReactionType) => Promise<{ error: string | null }>
  onRemoveReaction: (itemId: string) => Promise<{ error: string | null }>
  onAddComment: (itemId: string, text: string) => Promise<{ error: string | null }>
  onUpdateStatus: (itemId: string, status: ItineraryItemStatus) => Promise<{ error: string | null }>
  onDelete: (itemId: string) => Promise<{ error: string | null }>
}

export function ItineraryTimeline({
  trip,
  items,
  currentUserId,
  currentUserRole,
  onAddReaction,
  onRemoveReaction,
  onAddComment,
  onUpdateStatus,
  onDelete
}: ItineraryTimelineProps) {
  
  // Group items by day_number (number for scheduled days, null for unscheduled)
  const groupedItems = items.reduce((acc, item) => {
    const key = item.day_number === null || item.day_number === undefined ? 'unscheduled' : String(item.day_number)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, ItineraryItem[]>)

  // Sort scheduled days ascending
  const scheduledDays = Object.keys(groupedItems)
    .filter(k => k !== 'unscheduled')
    .map(Number)
    .sort((a, b) => a - b)

  const getDayDateString = (dayNum: number) => {
    if (trip.date_mode !== 'fixed' || !trip.start_date) return null
    const base = new Date(trip.start_date)
    base.setDate(base.getDate() + (dayNum - 1))
    return base.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const renderDaySection = (dayKey: string, dayTitle: string, subtitle?: string | null) => {
    const dayItems = groupedItems[dayKey]
    if (!dayItems || dayItems.length === 0) return null

    return (
      <div key={dayKey} className="space-y-3 relative pl-4 md:pl-6 border-l border-indigo-100 pb-6 last:pb-2">
        {/* Decorative timeline node */}
        <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-indigo-50" />

        {/* Sticky Day Header */}
        <div className="sticky top-16 bg-white/90 backdrop-blur-sm py-1.5 z-10 flex justify-between items-baseline border-b border-border mb-3 select-none">
          <h3 className="font-bold text-sm text-foreground">
            {dayTitle}
          </h3>
          {subtitle && (
            <span className="text-xs font-semibold text-primary">{subtitle}</span>
          )}
        </div>

        {/* Item Cards list */}
        <div className="space-y-4">
          {dayItems.map((item) => (
            <ItineraryItemCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
              onAddComment={onAddComment}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Scheduled Days */}
      {scheduledDays.map((dayNum) => {
        const dateStr = getDayDateString(dayNum)
        return renderDaySection(
          String(dayNum),
          `วันที่ ${dayNum}`,
          dateStr ? `📅 ${dateStr}` : null
        )
      })}

      {/* 2. Unscheduled Section */}
      {renderDaySection('unscheduled', 'ยังไม่ระบุวันเดินทาง')}
    </div>
  )
}
