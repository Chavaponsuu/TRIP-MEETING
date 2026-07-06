import Link from 'next/link'
import { Trip } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MONTH_NAMES_TH } from '@/lib/constants'

interface TripCardProps {
  trip: Trip
  memberCount?: number
}

export function TripCard({ trip, memberCount }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:shadow-md hover:border-primary/30 transition-all duration-150 cursor-pointer">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{trip.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{trip.name}</h3>
            <p className="text-sm text-text-secondary truncate">{trip.destination}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary">
                {MONTH_NAMES_TH[trip.month - 1]} {trip.year}
              </Badge>
              {memberCount !== undefined && (
                <Badge>{memberCount} คน</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
