import { Trip } from '@/types'
import { MONTH_NAMES_TH } from '@/lib/constants'

interface TripHeaderProps {
  trip: Trip
}

export function TripHeader({ trip }: TripHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl">{trip.emoji}</span>
      <div>
        <h1 className="text-xl font-bold text-foreground">{trip.name}</h1>
        <p className="text-sm text-text-secondary">
          {trip.destination} · {MONTH_NAMES_TH[trip.month - 1]} {trip.year}
        </p>
      </div>
    </div>
  )
}
