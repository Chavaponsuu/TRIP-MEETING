import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TripList } from '@/components/trip/TripList'
import { Button } from '@/components/ui/Button'
import { isTripPast } from '@/lib/utils'
import { Trip } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user!.id)

  const tripIds = memberships?.map(m => m.trip_id) ?? []

  let trips: Trip[] = []
  const memberCounts: Record<string, number> = {}

  if (tripIds.length > 0) {
    const { data: tripsData } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('created_at', { ascending: false })

    trips = tripsData ?? []

    const { data: allMembers } = await supabase
      .from('trip_members')
      .select('trip_id')
      .in('trip_id', tripIds)

    allMembers?.forEach(m => {
      memberCounts[m.trip_id] = (memberCounts[m.trip_id] ?? 0) + 1
    })
  }

  const activeCount = trips.filter(t => !isTripPast(t)).length
  const historyCount = trips.filter(t => isTripPast(t)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">ทริปของฉัน</h1>
          <p className="text-sm text-text-secondary mt-1">
            {trips.length > 0
              ? `${activeCount} กำลังวางแผน · ${historyCount} ไปแล้ว`
              : 'เริ่มวางแผนทริปแรกของคุณ'}
          </p>
        </div>
        <Link href="/trips/new" className="shrink-0">
          <Button size="md" className="whitespace-nowrap">
            <span className="sm:hidden">+ ทริป</span>
            <span className="hidden sm:inline">+ สร้างทริป</span>
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="text-foreground font-medium">ยังไม่มีทริป</p>
          <p className="text-sm text-text-secondary mt-1 mb-6">
            สร้างทริปแล้วชวนเพื่อนมาเลือกวันว่างกัน
          </p>
          <Link href="/trips/new">
            <Button>สร้างทริปแรก</Button>
          </Link>
        </div>
      ) : (
        <TripList
          trips={trips}
          memberCounts={memberCounts}
          userId={user!.id}
        />
      )}
    </div>
  )
}
