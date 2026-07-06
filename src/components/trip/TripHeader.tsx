import { Trip } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { formatTripMonthRange, isTripPast } from '@/lib/utils'

interface TripHeaderProps {
  trip: Trip
}

export function TripHeader({ trip }: TripHeaderProps) {
  const isPast = isTripPast(trip)

  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">{trip.emoji}</span>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">{trip.name}</h1>
          {isPast && (
            <Badge className="bg-emerald-100 text-emerald-700">ไปแล้ว ✓</Badge>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          {trip.destination} · {formatTripMonthRange(trip)}
        </p>
      </div>
    </div>
  )
}
