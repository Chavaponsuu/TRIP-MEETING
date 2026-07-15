'use client'

import Link from 'next/link'
import { Trip, TripStatus } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DeleteTripButton } from '@/components/trip/DeleteTripButton'
import { formatTripMonthRange, isTripPast } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TripCardProps {
  trip: Trip
  memberCount?: number
  isCreator?: boolean
}

export function TripCard({ trip, memberCount, isCreator }: TripCardProps) {
  const isPast = isTripPast(trip)

  // 1. Join multiple destinations with a comma
  const destinationsText = Array.isArray(trip.destination) 
    ? trip.destination.join(', ') 
    : String(trip.destination || '')

  // 2. RSVP Summary counts
  const members = trip.members ?? []
  const goingCount = members.filter(m => m.rsvp_status === 'going').length
  const maybeCount = members.filter(m => m.rsvp_status === 'maybe').length

  // 3. Status Translation & Variant mapping
  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success" className="bg-green-100 text-green-800 font-bold border border-green-200">ยืนยันแล้ว</Badge>
      case 'ongoing':
        return <Badge variant="primary" className="bg-blue-100 text-blue-800 font-bold border border-blue-200">กำลังเดินทาง</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-gray-100 text-gray-800 font-bold border border-gray-200">เสร็จสิ้น</Badge>
      case 'cancelled':
        return <Badge variant="default" className="bg-red-100 text-red-800 font-bold border border-red-200">ยกเลิกแล้ว</Badge>
      case 'draft':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 font-bold border border-yellow-200">ร่างทริป</Badge>
      default:
        return <Badge variant="primary" className="bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">วางแผน</Badge>
    }
  }

  // 4. Date formatting for fixed mode
  const formatDateStr = (dStr: string) => {
    const d = new Date(dStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const renderDateRange = () => {
    if (trip.date_mode === 'fixed' && trip.start_date && trip.end_date) {
      return `📅 ${formatDateStr(trip.start_date)} - ${formatDateStr(trip.end_date)}`
    }
    return formatTripMonthRange(trip)
  }

  return (
    <Card
      className={cn(
        'transition-all duration-150 touch-manipulation active:scale-[0.98]',
        isPast ? 'opacity-80 bg-gray-50/50' : 'hover:shadow-md hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-3">
        <Link href={`/trips/${trip.id}`} className="flex items-start gap-3 flex-1 min-w-0">
          <span className={cn('text-4xl shrink-0', isPast && 'grayscale-[30%]')}>{trip.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate text-base">{trip.name}</h3>
            
            {/* Multi Destinations */}
            <p className="text-sm text-text-secondary truncate mt-0.5">{destinationsText}</p>
            
            {/* Date and Status Badge line */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={isPast ? 'default' : 'primary'}>
                {renderDateRange()}
              </Badge>
              {getStatusBadge(trip.status)}
              {isPast && (
                <Badge variant="success" className="bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                  ไปแล้ว ✓
                </Badge>
              )}
            </div>

            {/* RSVP Summary Footer */}
            <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary font-semibold">
              {memberCount !== undefined && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{memberCount} สมาชิก</span>
              )}
              {goingCount > 0 && (
                <span className="text-green-600">👍 {goingCount} ไปแน่นอน</span>
              )}
              {maybeCount > 0 && (
                <span className="text-yellow-600">❓ {maybeCount} อาจจะไป</span>
              )}
            </div>
          </div>
        </Link>

        {isCreator && (
          <div className="shrink-0 pt-1">
            <DeleteTripButton tripId={trip.id} tripName={trip.name} variant="text" />
          </div>
        )}
      </div>
    </Card>
  )
}
