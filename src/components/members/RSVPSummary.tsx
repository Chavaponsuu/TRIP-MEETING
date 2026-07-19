'use client'

import { useState } from 'react'
import { Trip, TripMember, TripRole } from '@/types'
import { useRSVP } from '@/hooks/useRSVP'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'

interface RSVPSummaryProps {
  trip: Trip
  currentUserId: string
  currentUserRole: TripRole
  onReminderSent?: () => void
}

export function RSVPSummary({ trip, currentUserId, currentUserRole, onReminderSent }: RSVPSummaryProps) {
  const { sendReminders, loading } = useRSVP(trip.id)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isOrganizer = currentUserRole === 'owner' || currentUserRole === 'co_organizer'
  const members = trip.members ?? []

  // Group members
  const going = members.filter(m => m.rsvp_status === 'going')
  const maybe = members.filter(m => m.rsvp_status === 'maybe')
  const notGoing = members.filter(m => m.rsvp_status === 'not_going')
  const pending = members.filter(m => m.rsvp_status === 'pending')

  const handleSendReminder = async () => {
    setMsg(null)
    const { count, error } = await sendReminders()
    if (error) {
      setMsg({ type: 'error', text: error })
    } else if (count === 0) {
      setMsg({ type: 'success', text: 'สมาชิกทุกคนพึ่งได้รับการเตือนหรือไม่มีคนรอดำเนินการ' })
    } else {
      setMsg({ type: 'success', text: `ส่งคำเตือนเรียบร้อยแล้วทั้งหมด ${count} คน` })
      if (onReminderSent) onReminderSent()
    }
  }

  const renderGroup = (title: string, list: TripMember[], emoji: string) => {
    if (list.length === 0) return null
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-text-secondary">
          {title} ({list.length} คน)
        </h4>
        <div className="space-y-2 pl-1">
          {list.map(member => {
            const profile = member.user
            if (!profile) return null
            return (
              <div key={member.id} className="flex items-center gap-2">
                <MemberAvatar profile={profile} size="sm" />
                <span className="text-sm text-foreground font-semibold">{profile.name}</span>
                {member.role !== 'member' && (
                  <span className="text-[10px] bg-indigo-50 text-primary px-1.5 py-0.5 rounded font-bold">
                    {member.role === 'owner' ? 'ผู้สร้าง' : 'ผู้ร่วมจัด'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-base text-foreground">สรุปการตอบรับ RSVP</h3>
          <p className="text-xs text-text-secondary">สรุปจำนวนสมาชิกที่พร้อมร่วมทริปนี้</p>
        </div>

        {isOrganizer && (maybe.length > 0 || pending.length > 0) && (
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={handleSendReminder}
          >
            🔔 เตือนคนที่รอยืนยัน
          </Button>
        )}
      </div>

      {msg && (
        <div className={`p-2.5 text-xs rounded-lg font-semibold ${
          msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Numerical Breakdown */}
      <div className="grid grid-cols-4 gap-2 text-center py-2 bg-gray-50 rounded-xl">
        <div>
          <p className="text-lg font-bold text-green-600">{going.length}</p>
          <p className="text-[10px] text-text-secondary">ไปแน่นอน</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-600">{maybe.length}</p>
          <p className="text-[10px] text-text-secondary">อาจจะไป</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">{notGoing.length}</p>
          <p className="text-[10px] text-text-secondary">ไม่ไป</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-500">{pending.length}</p>
          <p className="text-[10px] text-text-secondary">รอตอบรับ</p>
        </div>
      </div>

      {/* Group Lists */}
      <div className="space-y-4 pt-2 border-t border-border">
        {renderGroup('ไปแน่นอน', going, '✅')}
        {renderGroup('อาจจะไป', maybe, '❓')}
        {renderGroup('รอการตอบรับ', pending, '⏳')}
        {renderGroup('ไม่ไปร่วม', notGoing, '❌')}
      </div>
    </div>
  )
}
