/**
 * TripCardGrid - Responsive grid layout for trip cards
 */

'use client'

import { Trip } from '@/types'
import { DashboardTripCard } from './DashboardTripCard'

interface TripCardGridProps {
  trips: Trip[]
  emptyMessage?: string
}

export function TripCardGrid({ trips, emptyMessage }: TripCardGridProps) {
  if (trips.length === 0 && emptyMessage) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {trips.map((trip) => (
        <DashboardTripCard key={trip.id} trip={trip} />
      ))}
    </div>
  )
}
