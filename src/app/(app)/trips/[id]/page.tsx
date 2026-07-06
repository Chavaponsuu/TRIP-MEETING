'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTrip } from '@/hooks/useTrip'
import { useAvailability } from '@/hooks/useAvailability'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/hooks/useAuth'
import { TripHeader } from '@/components/trip/TripHeader'
import { CalendarGrid, getBestDays } from '@/components/calendar/CalendarGrid'
import { BestDaysPodium } from '@/components/trip/BestDaysPodium'
import { MemberList } from '@/components/members/MemberList'
import { InviteBox } from '@/components/trip/InviteBox'
import { CommentThread } from '@/components/trip/CommentThread'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { MONTH_NAMES_TH } from '@/lib/constants'

const TABS = [
  { id: 'availability', label: 'วันว่าง' },
  { id: 'best', label: 'วันที่ดีที่สุด' },
  { id: 'members', label: 'สมาชิก' },
  { id: 'info', label: 'ข้อมูล' },
] as const

type TabId = typeof TABS[number]['id']

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.id as string
  const { user } = useAuth()
  const { trip, loading, error, refetch, appendComment } = useTrip(tripId)
  const { selectedDays, toggleDay, save, saving, loading: availLoading } = useAvailability(tripId, user?.id, refetch)
  const { onCommentAdded } = useComments(appendComment)
  const [activeTab, setActiveTab] = useState<TabId>('availability')
  const [activeMonthIdx, setActiveMonthIdx] = useState(0)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-10 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😕</p>
        <p className="font-medium text-foreground">{error ?? 'ไม่พบทริปนี้'}</p>
        <p className="text-sm text-text-secondary mt-1">ทริปอาจถูกลบหรือคุณไม่มีสิทธิ์เข้าถึง</p>
      </div>
    )
  }

  // Handle multiple months with backward compatibility
  const tripMonths = trip.months && trip.months.length > 0
    ? trip.months
    : [{ month: trip.month, year: trip.year }]

  const activeMonth = tripMonths[activeMonthIdx] || tripMonths[0]
  const bestDays = getBestDays(trip)
  const totalMembers = trip.members?.length ?? 0

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground font-medium transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        กลับไปแดชบอร์ด
      </Link>

      <TripHeader trip={trip} />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all duration-150',
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {activeTab === 'availability' && (
          <div className="space-y-4">
            {!availLoading && (
              <>
                {tripMonths.length > 1 && (
                  <div className="flex gap-1.5 border-b border-border pb-3 mb-2 overflow-x-auto select-none">
                    {tripMonths.map((m, idx) => (
                      <button
                        key={`${m.year}-${m.month}`}
                        type="button"
                        onClick={() => setActiveMonthIdx(idx)}
                        className={cn(
                          'py-1 px-3 text-xs font-semibold rounded-full border transition-all duration-150',
                          activeMonthIdx === idx
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white border-border text-text-secondary hover:border-gray-400'
                        )}
                      >
                        {MONTH_NAMES_TH[m.month - 1]} {m.year}
                      </button>
                    ))}
                  </div>
                )}

                <CalendarGrid
                  trip={trip}
                  mode="edit"
                  selectedDays={selectedDays}
                  onToggleDay={(day) => toggleDay(day, activeMonth.month, activeMonth.year)}
                  activeMonth={activeMonth.month}
                  activeYear={activeMonth.year}
                />
                <Button
                  onClick={save}
                  loading={saving}
                  className="w-full"
                >
                  บันทึกวันว่าง
                </Button>
              </>
            )}
          </div>
        )}

        {activeTab === 'best' && (
          <div className="space-y-6">
            <BestDaysPodium
              bestDays={bestDays}
              totalMembers={totalMembers}
            />
            
            {tripMonths.length > 1 && (
              <div className="flex gap-1.5 border-b border-border pb-3 mb-2 overflow-x-auto select-none">
                {tripMonths.map((m, idx) => (
                  <button
                    key={`${m.year}-${m.month}`}
                    type="button"
                    onClick={() => setActiveMonthIdx(idx)}
                    className={cn(
                      'py-1 px-3 text-xs font-semibold rounded-full border transition-all duration-150',
                      activeMonthIdx === idx
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-border text-text-secondary hover:border-gray-400'
                    )}
                  >
                    {MONTH_NAMES_TH[m.month - 1]} {m.year}
                  </button>
                ))}
              </div>
            )}
            <CalendarGrid
              trip={trip}
              mode="heatmap"
              activeMonth={activeMonth.month}
              activeYear={activeMonth.year}
            />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            {tripMonths.length > 1 && (
              <div className="flex gap-1.5 border-b border-border pb-3 mb-2 overflow-x-auto select-none">
                {tripMonths.map((m, idx) => (
                  <button
                    key={`${m.year}-${m.month}`}
                    type="button"
                    onClick={() => setActiveMonthIdx(idx)}
                    className={cn(
                      'py-1 px-3 text-xs font-semibold rounded-full border transition-all duration-150',
                      activeMonthIdx === idx
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-border text-text-secondary hover:border-gray-400'
                    )}
                  >
                    {MONTH_NAMES_TH[m.month - 1]} {m.year}
                  </button>
                ))}
              </div>
            )}
            <MemberList
              members={trip.members ?? []}
              availabilities={trip.availabilities ?? []}
              month={trip.month}
              year={trip.year}
              activeMonth={activeMonth.month}
              activeYear={activeMonth.year}
            />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            {trip.description && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">รายละเอียด</h3>
                <p className="text-sm text-text-secondary">{trip.description}</p>
              </div>
            )}
            <InviteBox inviteCode={trip.invite_code} />
            <CommentThread
              tripId={trip.id}
              comments={trip.comments ?? []}
              onCommentAdded={onCommentAdded}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
