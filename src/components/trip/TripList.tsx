'use client'

import { Trip } from '@/types'
import { TripCard } from '@/components/trip/TripCard'
import { isTripPast } from '@/lib/utils'

interface TripListProps {
  trips: Trip[]
  memberCounts: Record<string, number>
  userId: string
}

export function TripList({ trips, memberCounts, userId }: TripListProps) {
  const activeTrips = trips.filter(t => !isTripPast(t))
  const historyTrips = trips.filter(t => isTripPast(t))

  if (trips.length === 0) return null

  return (
    <div className="space-y-8">
      {activeTrips.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            กำลังวางแผน ({activeTrips.length})
          </h2>
          {activeTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              memberCount={memberCounts[trip.id]}
              isCreator={trip.created_by === userId}
            />
          ))}
        </section>
      )}

      {historyTrips.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            ประวัติทริป ({historyTrips.length})
          </h2>
          {historyTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              memberCount={memberCounts[trip.id]}
              isCreator={trip.created_by === userId}
            />
          ))}
        </section>
      )}
    </div>
  )
}
