/**
 * DashboardTripCard - Trip card for dashboard with cover image, avatar stack, and date/status
 */

'use client'

import Link from 'next/link'
import { Trip, TripStatus, Profile } from '@/types'
import { AvatarStack } from './AvatarStack'
import { cn } from '@/lib/utils'

interface DashboardTripCardProps {
  trip: Trip
}

export function DashboardTripCard({ trip }: DashboardTripCardProps) {
  // 1. Get going members for avatar stack
  const goingMembers = (trip.members || [])
    .filter(m => m.rsvp_status === 'going' && m.user)
    .map(m => m.user!)
    .filter((u): u is Profile => u !== null)

  // 2. Status badge translation
  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'draft':
        return { text: 'ร่าง', color: 'bg-yellow-100 text-yellow-800' }
      case 'planning':
        return { text: 'กำลังวางแพลน', color: 'bg-indigo-100 text-indigo-800' }
      case 'confirmed':
        return { text: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-800' }
      case 'ongoing':
        return { text: 'กำลังเดินทาง', color: 'bg-blue-100 text-blue-800' }
      case 'completed':
        return { text: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-800' }
      case 'cancelled':
        return { text: 'ยกเลิก', color: 'bg-red-100 text-red-800' }
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const statusBadge = getStatusBadge(trip.status)

  // 3. Date/status text
  const getDateText = () => {
    if (trip.date_mode === 'fixed' && trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date)
      const end = new Date(trip.end_date)
      const startDay = start.getDate()
      const endDay = end.getDate()
      const month = start.toLocaleDateString('th-TH', { month: 'short' })
      
      if (startDay === endDay) {
        return `${startDay} ${month}`
      }
      return `${startDay}–${endDay} ${month}`
    }
    return 'รอโหวตวันที่'
  }

  // 4. Destination text
  const destinationText = Array.isArray(trip.destination)
    ? trip.destination.join(' → ')
    : String(trip.destination || '')

  // 5. Generate gradient for fallback cover
  const getCoverGradient = (tripId: string) => {
    // Use trip ID to generate consistent gradient
    const hash = tripId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-orange-500',
      'from-green-400 to-cyan-500',
      'from-yellow-400 to-red-500',
      'from-indigo-400 to-pink-500',
      'from-cyan-400 to-blue-500',
    ]
    return gradients[hash % gradients.length]
  }

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-150 hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
        {/* Cover Image / Gradient */}
        <div className="relative h-32 overflow-hidden">
          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', getCoverGradient(trip.id))} />
          )}

          {/* Status Badge (bottom-left) */}
          <div className="absolute bottom-2 left-2">
            <span
              className={cn(
                'px-2 py-1 rounded-md text-xs font-bold shadow-sm',
                statusBadge.color
              )}
            >
              {statusBadge.text}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-base font-bold text-foreground truncate flex items-center gap-1.5">
            <span>{trip.emoji}</span>
            <span>{trip.name}</span>
          </h3>

          {/* Destination */}
          {destinationText && (
            <p className="text-sm text-text-secondary truncate mt-1">
              📍 {destinationText}
            </p>
          )}

          {/* Footer: Avatar Stack + Date */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <AvatarStack users={goingMembers} maxDisplay={3} size={32} />
            
            <div className="text-xs font-semibold text-text-secondary whitespace-nowrap">
              {getDateText()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
