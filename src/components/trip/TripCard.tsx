'use client'

import Link from 'next/link'
import { Trip } from '@/types'
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
            <p className="text-sm text-text-secondary truncate mt-0.5">{trip.destination}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant={isPast ? 'default' : 'primary'}>
                {formatTripMonthRange(trip)}
              </Badge>
              {isPast && (
                <Badge variant="default" className="bg-emerald-100 text-emerald-700 font-semibold">
                  ไปแล้ว ✓
                </Badge>
              )}
              {memberCount !== undefined && (
                <Badge>{memberCount} คน</Badge>
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
