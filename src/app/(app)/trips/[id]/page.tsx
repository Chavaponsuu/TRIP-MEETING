'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTrip } from '@/hooks/useTrip'
import { useTripRole } from '@/hooks/useTripRole'
import { useAvailability } from '@/hooks/useAvailability'
import { useAuth } from '@/hooks/useAuth'
import { usePolls } from '@/hooks/usePolls'
import { useItinerary } from '@/hooks/useItinerary'
import { MetricCards } from '@/components/trip/MetricCards'
import { MemberListWithRSVP } from '@/components/members/MemberListWithRSVP'
import { AvailabilityHeatmap } from '@/components/calendar/AvailabilityHeatmap'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { PollCreator } from '@/components/trip/PollCreator'
import { PollCard } from '@/components/trip/PollCard'
import { ItineraryTimeline } from '@/components/trip/ItineraryTimeline'
import { ItineraryItemForm } from '@/components/trip/ItineraryItemForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn, getTripMonths } from '@/lib/utils'
import { MONTH_NAMES_TH } from '@/lib/constants'

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.id as string
  const { user } = useAuth()
  
  const { trip, loading, error, refetch } = useTrip(tripId)
  const { role, isOrganizer } = useTripRole(tripId)
  const { selectedDays, toggleDay, save, saving } = useAvailability(tripId, user?.id, refetch)

  // Feature hooks
  const { polls, vote: votePoll, deletePoll, refetch: refetchPolls } = usePolls(tripId)
  const {
    items: itineraryItems,
    createItem,
    updateItemStatus,
    deleteItem,
    addReaction,
    removeReaction,
    addComment: addItineraryComment,
  } = useItinerary(tripId)

  // UI state
  const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false)
  const [isItineraryFormOpen, setIsItineraryFormOpen] = useState(false)
  const [activeMonthIdx, setActiveMonthIdx] = useState(0)
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
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
  const activeMonth = tripMonths[activeMonthIdx] || tripMonths[0]
  const goingCount = trip.members?.filter((m) => m.rsvp_status === 'going').length ?? 0

  const getStatusLabel = () => {
    switch (trip.status) {
      case 'draft': return 'ร่าง'
      case 'planning': return 'กำลังวางแผน'
      case 'confirmed': return 'ยืนยันแล้ว'
      case 'ongoing': return 'กำลังเดินทาง'
      case 'completed': return 'เสร็จสิ้น'
      case 'cancelled': return 'ยกเลิก'
      default: return trip.status
    }
  }

  const getStatusColor = () => {
    switch (trip.status) {
      case 'draft': return 'muted'
      case 'planning': return 'warning'
      case 'confirmed': return 'success'
      case 'ongoing': return 'primary'
      case 'completed': return 'default'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div className="min-h-screen w-full pb-8">
      {/* Back Button */}
      <div className="mb-4 lg:mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-semibold transition-colors group touch-manipulation"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>กลับไปแดชบอร์ด</span>
        </Link>
      </div>

      {/* Main Content Container with 2-column layout on desktop */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-max">
        
        {/* Left Column (Main Content) - 8 columns on desktop */}
        <div className="lg:col-span-8 w-full space-y-4 lg:space-y-6 min-w-0">
          
          {/* SECTION 1: TRIP HEADER */}
          <Card className="p-0 lg:p-0 w-full overflow-hidden">
            {/* Cover Image */}
            {trip.cover_image_url && (
              <div className="relative w-full h-48 lg:h-64">
                <img
                  src={trip.cover_image_url}
                  alt={trip.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Trip Info */}
            <div className="p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl lg:text-5xl flex-shrink-0">{trip.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl lg:text-2xl font-bold text-foreground break-words">{trip.name}</h1>
                      <p className="text-sm lg:text-base text-text-secondary break-words">
                        {trip.destination.join(' → ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusColor()} size="sm">
                      {getStatusLabel()}
                    </Badge>
                    <span className="text-sm text-text-secondary">
                      • {goingCount} คนไปแน่นอน
                    </span>
                  </div>
                </div>
                {isOrganizer && (
                  <Link href={`/trips/${tripId}/settings`} className="flex-shrink-0">
                    <Button variant="secondary" size="sm" className="gap-1.5 whitespace-nowrap w-full sm:w-auto">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden sm:inline">จัดการทริป</span>
                      <span className="sm:hidden">จัดการ</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {/* SECTION 2: METRIC CARDS */}
          <div className="w-full overflow-hidden">
            <MetricCards
              trip={trip}
              goingCount={goingCount}
              canManage={isOrganizer}
              onTripUpdated={refetch}
            />
          </div>

          {/* SECTION 4: AVAILABILITY HEATMAP */}
          <Card className="p-4 lg:p-6 w-full overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">วันที่ว่าง</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingAvailability(!isEditingAvailability)}
                  className="self-start sm:self-auto whitespace-nowrap"
                >
                  {isEditingAvailability ? 'ดูสรุป' : 'เลือกวันที่ตัวเองว่าง'}
                </Button>
              </div>

              <div className="w-full overflow-hidden">
                {isEditingAvailability ? (
                  <>
                    {tripMonths.length > 1 && (
                      <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
                        <div className="flex gap-2 min-w-min">
                          {tripMonths.map((m, idx) => (
                            <button
                              key={`${m.year}-${m.month}`}
                              onClick={() => setActiveMonthIdx(idx)}
                              className={cn(
                                'px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all whitespace-nowrap flex-shrink-0',
                                activeMonthIdx === idx
                                  ? 'bg-primary border-primary text-white'
                                  : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                              )}
                            >
                              {MONTH_NAMES_TH[m.month - 1]} {m.year}
                            </button>
                          ))}
                        </div>
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
                    <Button onClick={save} loading={saving} className="w-full">
                      บันทึกวันว่าง
                    </Button>
                  </>
                ) : (
                  <AvailabilityHeatmap
                    trip={trip}
                    currentUserId={user?.id || ''}
                    canConfirmDates={isOrganizer}
                    onDateConfirmed={refetch}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* SECTION 5: POLLS */}
          <Card className="p-4 lg:p-6 w-full overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">โพลล์และความคิดเห็น</h2>
                {isOrganizer && !isPollCreatorOpen && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => setIsPollCreatorOpen(true)}
                    className="self-start sm:self-auto whitespace-nowrap"
                  >
                    ＋ สร้างโพลล์
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
                <div className="text-center py-10 lg:py-12 bg-gray-50 rounded-xl border border-dashed border-border">
                  <p className="text-3xl lg:text-4xl">🗳️</p>
                  <p className="font-semibold text-text-secondary text-sm lg:text-base mt-2">ยังไม่มีโพลล์ในทริปนี้</p>
                  {isOrganizer && (
                    <p className="text-xs lg:text-sm text-text-secondary mt-1">คลิกปุ่มด้านบนเพื่อสร้างโพลล์แรก</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {polls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      currentUserId={user?.id || ''}
                      currentUserRole={role}
                      onUpdated={refetchPolls}
                      onVote={votePoll}
                      onDelete={deletePoll}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* SECTION 6: ITINERARY */}
          <Card className="p-4 lg:p-6 w-full overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">กำหนดการ</h2>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setIsItineraryFormOpen(true)}
                  className="self-start sm:self-auto whitespace-nowrap"
                >
                  ＋ เพิ่มกิจกรรม
                </Button>
              </div>

              {itineraryItems.length === 0 ? (
                <div className="text-center py-12 lg:py-16 bg-gray-50 rounded-xl border border-dashed border-border">
                  <p className="text-3xl lg:text-4xl">🗺️</p>
                  <p className="font-semibold text-text-secondary text-sm lg:text-base mt-2">ยังไม่มีกำหนดการ</p>
                  <p className="text-xs lg:text-sm text-text-secondary mt-1">เริ่มเพิ่มกิจกรรมแรกกันเลย</p>
                </div>
              ) : (
                <ItineraryTimeline
                  trip={trip}
                  items={itineraryItems}
                  currentUserId={user?.id || ''}
                  currentUserRole={role}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onAddComment={addItineraryComment}
                  onUpdateStatus={updateItemStatus}
                  onDelete={deleteItem}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar (Desktop only) - 4 columns on desktop */}
        <div className="lg:col-span-4 w-full space-y-4 lg:space-y-6 min-w-0">
          
          {/* SECTION 3: MEMBER LIST WITH RSVP - Sticky on desktop */}
          <div className="lg:sticky lg:top-4 w-full">
            <Card className="p-4 lg:p-6 w-full overflow-hidden">
              <MemberListWithRSVP
                trip={trip}
                currentUserId={user?.id || ''}
                currentUserRole={role}
                onMemberRemoved={refetch}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Itinerary Form Modal */}
      <ItineraryItemForm
        isOpen={isItineraryFormOpen}
        onClose={() => setIsItineraryFormOpen(false)}
        onCreateItem={createItem}
        maxDays={tripMonths.length * 31}
      />
    </div>
  )
}

