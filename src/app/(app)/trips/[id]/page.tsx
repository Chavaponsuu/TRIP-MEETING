'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTrip } from '@/hooks/useTrip'
import { useAvailability } from '@/hooks/useAvailability'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/hooks/useAuth'
import { usePolls } from '@/hooks/usePolls'
import { useItinerary } from '@/hooks/useItinerary'
import { TripHeader } from '@/components/trip/TripHeader'
import { CalendarGrid, getBestDays } from '@/components/calendar/CalendarGrid'
import { BestDaysPodium } from '@/components/trip/BestDaysPodium'
import { RSVPStatus } from '@/components/members/RSVPStatus'
import { RSVPSummary } from '@/components/members/RSVPSummary'
import { PollCreator } from '@/components/trip/PollCreator'
import { PollCard } from '@/components/trip/PollCard'
import { ItineraryTimeline } from '@/components/trip/ItineraryTimeline'
import { ItineraryItemForm } from '@/components/trip/ItineraryItemForm'
import { InviteBox } from '@/components/trip/InviteBox'
import { InviteFriendsBox } from '@/components/trip/InviteFriendsBox'
import { DeleteTripButton } from '@/components/trip/DeleteTripButton'
import { CommentThread } from '@/components/trip/CommentThread'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, isTripPast, getTripMonths } from '@/lib/utils'
import { MONTH_NAMES_TH } from '@/lib/constants'

const TABS = [
  { id: 'availability', label: 'วันว่าง' },
  { id: 'best', label: 'วันที่ดีที่สุด' },
  { id: 'polls', label: 'โหวต' },
  { id: 'itinerary', label: 'กำหนดการ' },
  { id: 'members', label: 'สมาชิก' },
  { id: 'info', label: 'ข้อมูล' },
] as const

type TabId = typeof TABS[number]['id']

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string
  const { user } = useAuth()
  
  const { trip, loading, error, refetch, appendComment } = useTrip(tripId)
  const { selectedDays, toggleDay, save, saving, loading: availLoading } = useAvailability(tripId, user?.id, refetch)
  const { onCommentAdded } = useComments(appendComment)

  // New features hooks
  const { polls, refetch: refetchPolls } = usePolls(tripId)
  const {
    items: itineraryItems,
    createItem,
    updateItemStatus,
    deleteItem,
    addReaction,
    removeReaction,
    addComment: addItineraryComment,
    refetch: refetchItinerary
  } = useItinerary(tripId)

  const [activeTab, setActiveTab] = useState<TabId>('availability')
  const [activeMonthIdx, setActiveMonthIdx] = useState(0)

  // Poll Creator state
  const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false)

  // Itinerary Form Bottom-sheet state
  const [isItineraryFormOpen, setIsItineraryFormOpen] = useState(false)

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

  const tripMonths = getTripMonths(trip)
  const isPast = isTripPast(trip)
  const isCreator = user?.id === trip.created_by
  const memberRelation = trip.members?.find((m) => m.user_id === user?.id)
  const userRole = memberRelation?.role || 'member'
  const isOrganizer = userRole === 'owner' || userRole === 'co_organizer'

  const activeMonth = tripMonths[activeMonthIdx] || tripMonths[0]
  const bestDays = getBestDays(trip)
  const totalMembers = trip.members?.length ?? 0

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-semibold transition-colors group touch-manipulation">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span>กลับไปแดชบอร์ด</span>
      </Link>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <TripHeader trip={trip} />
        {isOrganizer && (
          <Link href={`/trips/${tripId}/settings`}>
            <Button variant="secondary" size="sm" className="gap-1.5 min-h-[36px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>ตั้งค่าทริป</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto select-none no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[70px] py-2 px-3 text-xs font-bold rounded-lg transition-all duration-150 touch-manipulation whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-foreground active:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {/* TAB 1: AVAILABILITY */}
        {activeTab === 'availability' && (
          <div className="space-y-4">
            {isPast ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-3xl">✈️</p>
                <p className="font-medium text-foreground">ทริปนี้จบแล้ว</p>
                <p className="text-sm text-text-secondary">
                  ดูผลสรุปได้ที่แท็บ &quot;วันที่ดีที่สุด&quot; และ &quot;สมาชิก&quot;
                </p>
              </div>
            ) : !availLoading && (
              <>
                {tripMonths.length > 1 && (
                  <div className="flex gap-2 border-b border-border pb-3 mb-2 overflow-x-auto select-none">
                    {tripMonths.map((m, idx) => (
                      <button
                        key={`${m.year}-${m.month}`}
                        type="button"
                        onClick={() => setActiveMonthIdx(idx)}
                        className={cn(
                          'py-2 px-4 text-sm font-semibold rounded-full border-2 transition-all duration-150 touch-manipulation whitespace-nowrap',
                          activeMonthIdx === idx
                            ? 'bg-primary border-primary text-white shadow-md scale-105'
                            : 'bg-white border-border text-text-secondary hover:border-gray-400 active:bg-gray-50'
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

        {/* TAB 2: BEST DAYS HEATMAP */}
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

        {/* TAB 3: POLLS */}
        {activeTab === 'polls' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">โพลล์และความคิดเห็น</h3>
              {isOrganizer && !isPollCreatorOpen && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPollCreatorOpen(true)}
                >
                  ＋ สร้างโพลล์ใหม่
                </Button>
              )}
            </div>

            {isPollCreatorOpen && (
              <PollCreator
                tripId={tripId}
                onCreated={() => {
                  setIsPollCreatorOpen(false)
                  refetchPolls()
                }}
                onCancel={() => setIsPollCreatorOpen(false)}
              />
            )}

            {polls.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-border">
                <p className="text-3xl">🗳️</p>
                <p className="font-semibold text-text-secondary text-sm mt-2">ยังไม่มีการสร้างโพลล์ในทริปนี้</p>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    currentUserId={user?.id || ''}
                    currentUserRole={userRole}
                    onUpdated={refetchPolls}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ITINERARY */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">กำหนดการและแผนการเดินทาง</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsItineraryFormOpen(true)}
              >
                ＋ เพิ่มกิจกรรม
              </Button>
            </div>

            {itineraryItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-border select-none">
                <p className="text-3xl">🗺️</p>
                <p className="font-semibold text-text-secondary text-sm mt-2">ยังไม่มีแผนการเดินทางที่เสนอแนะ</p>
                <p className="text-xs text-text-secondary mt-1">คลิกปุ่ม &quot;เพิ่มกิจกรรม&quot; ด้านบนเพื่อร่วมเสนอไอเดีย</p>
              </div>
            ) : (
              <ItineraryTimeline
                trip={trip}
                items={itineraryItems}
                currentUserId={user?.id || ''}
                currentUserRole={userRole}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
                onAddComment={addItineraryComment}
                onUpdateStatus={updateItemStatus}
                onDelete={deleteItem}
              />
            )}

            <ItineraryItemForm
              isOpen={isItineraryFormOpen}
              onClose={() => setIsItineraryFormOpen(false)}
              onCreateItem={createItem}
              maxDays={tripMonths.length * 31} // broad estimation
            />
          </div>
        )}

        {/* TAB 5: MEMBERS & RSVP */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {user && (
              <RSVPStatus
                trip={trip}
                currentUserId={user.id}
                onUpdated={refetch}
              />
            )}
            <RSVPSummary
              trip={trip}
              currentUserId={user?.id || ''}
              currentUserRole={userRole}
              onReminderSent={refetch}
            />
          </div>
        )}

        {/* TAB 6: INFO & CHAT */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {trip.description && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">รายละเอียด</h3>
                <p className="text-sm text-text-secondary">{trip.description}</p>
              </div>
            )}
            {!isPast && (
              <>
                <InviteFriendsBox
                  tripId={trip.id}
                  memberIds={trip.members?.map(m => m.user_id) ?? []}
                />
                <div className="border-t border-border pt-4">
                  <InviteBox inviteCode={trip.invite_code} />
                </div>
              </>
            )}
            {isPast && (
              <p className="text-sm text-text-secondary bg-gray-50 rounded-lg px-3 py-2">
                ทริปนี้จบแล้ว — ลิงก์ชวนเพื่อนถูกปิดใช้งาน
              </p>
            )}
            <CommentThread
              tripId={trip.id}
              comments={trip.comments ?? []}
              onCommentAdded={onCommentAdded}
            />
            {isCreator && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">จัดการทริป</h3>
                <DeleteTripButton tripId={trip.id} tripName={trip.name} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

