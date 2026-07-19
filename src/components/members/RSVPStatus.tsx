'use client'

import { useState } from 'react'
import { RSVPStatus as RSVPStatusType, Trip } from '@/types'
import { useRSVP } from '@/hooks/useRSVP'
import { Button } from '@/components/ui/Button'

interface RSVPStatusProps {
  trip: Trip
  currentUserId: string
  onUpdated: () => void
}

const RSVP_OPTIONS: { value: RSVPStatusType; label: string; emoji: string; colorClass: string }[] = [
  { value: 'going', label: 'ไปแน่นอน', emoji: '✅', colorClass: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { value: 'maybe', label: 'อาจจะไป', emoji: '❓', colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
  { value: 'not_going', label: 'ไม่ไป', emoji: '❌', colorClass: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { value: 'pending', label: 'รอดำเนินการ', emoji: '⏳', colorClass: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' }
]

export function RSVPStatus({ trip, currentUserId, onUpdated }: RSVPStatusProps) {
  const { updateRSVP, loading } = useRSVP(trip.id)
  const [error, setError] = useState<string | null>(null)

  const userMember = trip.members?.find(m => m.user_id === currentUserId)
  const currentStatus = userMember?.rsvp_status || 'pending'
  const updatedAt = userMember?.rsvp_updated_at

  const handleSelectStatus = async (status: RSVPStatusType) => {
    setError(null)
    const { error: err } = await updateRSVP(status)
    if (err) {
      setError(err)
    } else {
      onUpdated()
    }
  }

  const formatLastUpdated = (isoStr?: string | null) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return `อัปเดตล่าสุด: ${d.toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-base text-foreground">สถานะเข้าร่วมทริปของคุณ</h3>
        <p className="text-xs text-text-secondary">ตอบกลับ RSVP เพื่อช่วยผู้จัดทริปคำนวณจำนวนคน</p>
      </div>

      {error && (
        <div className="p-2.5 text-xs bg-red-50 text-red-600 rounded-lg font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {RSVP_OPTIONS.map((opt) => {
          const isSelected = currentStatus === opt.value
          return (
            <button
              key={opt.value}
              disabled={loading}
              onClick={() => handleSelectStatus(opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-150 touch-manipulation ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 scale-[1.02] font-bold bg-indigo-50/20'
                  : 'border-border text-foreground hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>

      {updatedAt && (
        <p className="text-[10px] text-text-secondary text-right italic select-none">
          {formatLastUpdated(updatedAt)}
        </p>
      )}
    </div>
  )
}
