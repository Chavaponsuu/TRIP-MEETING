/**
 * PendingInviteBanner - Banner for pending trip invitations
 */

'use client'

import Link from 'next/link'
import { Trip } from '@/types'
import { Button } from '@/components/ui/Button'

interface PendingInviteBannerProps {
  pendingTrips: Trip[]
}

export function PendingInviteBanner({ pendingTrips }: PendingInviteBannerProps) {
  if (pendingTrips.length === 0) return null

  const latestTrip = pendingTrips[0]
  const remainingCount = pendingTrips.length - 1

  const destinationText = Array.isArray(latestTrip.destination)
    ? latestTrip.destination.join(' → ')
    : String(latestTrip.destination || '')

  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground flex items-center gap-1.5">
            <span className="text-lg">{latestTrip.emoji}</span>
            <span className="truncate">{latestTrip.name}</span>
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            📍 {destinationText}
          </p>
          <p className="text-sm font-semibold text-yellow-800 mt-2">
            รอการตอบรับจากคุณ
            {remainingCount > 0 && ` และอีก ${remainingCount} ทริป`}
          </p>
        </div>

        {/* Action Button */}
        <Link href={`/trips/${latestTrip.id}`} className="flex-shrink-0">
          <Button variant="primary" size="sm">
            ดูรายละเอียด
          </Button>
        </Link>
      </div>
    </div>
  )
}
