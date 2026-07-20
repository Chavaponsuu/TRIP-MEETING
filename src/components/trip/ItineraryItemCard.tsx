'use client'

import { useState } from 'react'
import { ItineraryItem, ItineraryItemStatus, ReactionType } from '@/types'
import { ItineraryReactions } from './ItineraryReactions'
import { ItineraryComments } from './ItineraryComments'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ItineraryItemCardProps {
  item: ItineraryItem
  currentUserId: string
  currentUserRole: 'owner' | 'co_organizer' | 'member'
  onAddReaction: (itemId: string, type: ReactionType) => Promise<{ error: string | null }>
  onRemoveReaction: (itemId: string) => Promise<{ error: string | null }>
  onAddComment: (itemId: string, text: string) => Promise<{ error: string | null }>
  onUpdateStatus: (itemId: string, status: ItineraryItemStatus) => Promise<{ error: string | null }>
  onDelete: (itemId: string) => Promise<{ error: string | null }>
}

const TYPE_EMOJIS = {
  travel: '🚗',
  food: '🍜',
  activity: '🎭',
  accommodation: '🏨',
  free_time: '🏖️'
}

export function ItineraryItemCard({
  item,
  currentUserId,
  currentUserRole,
  onAddReaction,
  onRemoveReaction,
  onAddComment,
  onUpdateStatus,
  onDelete
}: ItineraryItemCardProps) {
  const [descExpanded, setDescExpanded] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOrganizer = currentUserRole === 'owner' || currentUserRole === 'co_organizer'
  const isCreator = item.created_by === currentUserId
  const canDelete = isOrganizer || isCreator

  const handleToggleStatus = async () => {
    if (!isOrganizer) return
    setUpdating(true)
    const newStatus = item.status === 'confirmed' ? 'proposed' : 'confirmed'
    await onUpdateStatus(item.id, newStatus)
    setUpdating(false)
  }

  const handleDelete = async () => {
    if (!canDelete) return
    if (confirm('คุณแน่ใจว่าต้องการลบกิจกรรมนี้?')) {
      setDeleting(true)
      await onDelete(item.id)
      setDeleting(false)
    }
  }

const formatTimeRange = () => {
  if (!item.start_time) return null

  const startTime = item.start_time.slice(0, 5)

  if (!item.end_time) return `${startTime} น.`

  const endTime = item.end_time.slice(0, 5)

  return `${startTime} - ${endTime} น.`
}

  return (
    <div 
      className={`border rounded-xl p-4 bg-white shadow-sm transition-all duration-150 ${
        item.status === 'confirmed'
          ? 'border-green-200 ring-1 ring-green-100 bg-green-50/5'
          : 'border-border'
      }`}
    >
      {/* Top row */}
      <div className="flex gap-3 justify-between items-start">
        <div className="flex gap-2.5 items-start min-w-0">
          <span className="text-2xl select-none" role="img" aria-label="type icon">
            {TYPE_EMOJIS[item.item_type] || '📍'}
          </span>
          <div className="min-w-0">
            <h4 className="font-bold text-foreground text-sm break-words leading-tight">
              {item.title}
            </h4>
            
            {/* Meta */}
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center mt-1 text-[11px] text-text-secondary">
              {formatTimeRange() && (
                <span className="font-semibold text-primary">{formatTimeRange()}</span>
              )}
              {item.location && (
                <span className="truncate">📍 {item.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex gap-1.5 items-center">
          {item.status === 'confirmed' ? (
            <Badge variant="success" className="bg-green-50 text-green-700 border border-green-200 font-bold text-[10px]">
              ยืนยันแล้ว ✓
            </Badge>
          ) : (
            <Badge variant="default" className="bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold text-[10px]">
              เสนอแนะ
            </Badge>
          )}

          {isOrganizer && (
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className="p-1 hover:bg-gray-100 rounded text-xs transition-colors"
              title={item.status === 'confirmed' ? 'เปลี่ยนเป็นเสนอแนะ' : 'ยืนยันกิจกรรม'}
            >
              {item.status === 'confirmed' ? '↩️' : '✅'}
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
              title="ลบกิจกรรม"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Description Expandable */}
      {item.description && (
        <div className="mt-2.5">
          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            {descExpanded ? '🔼 ซ่อนรายละเอียด' : '🔽 ดูรายละเอียดเพิ่มเติม'}
          </button>
          {descExpanded && (
            <p className="text-xs text-text-secondary bg-gray-50 p-2.5 rounded-lg mt-1.5 whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      )}

      {/* Footer bar with reactions and comments count toggle */}
      <div className="flex justify-between items-center pt-3 border-t border-border mt-3 gap-2 flex-wrap">
        <ItineraryReactions
          itemId={item.id}
          reactions={item.reactions}
          currentUserId={currentUserId}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />

        <button
          onClick={() => setCommentsExpanded(!commentsExpanded)}
          className="text-[11px] font-semibold text-text-secondary hover:text-foreground active:scale-95 transition-all p-1 hover:bg-gray-50 rounded"
        >
          💬 {commentsExpanded ? 'ซ่อน' : 'คุยกัน'} ({item.comments?.length || 0})
        </button>
      </div>

      {/* Creator Info (tiny) */}
      <div className="text-[9px] text-text-secondary mt-2 text-right">
        เสนอโดย: {item.creator?.name || 'สมาชิก'}
      </div>

      {/* Comments Drawer */}
      {commentsExpanded && (
        <ItineraryComments
          itemId={item.id}
          comments={item.comments}
          onAddComment={onAddComment}
        />
      )}
    </div>
  )
}
