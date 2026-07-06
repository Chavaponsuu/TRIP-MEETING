import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripHeader } from '@/components/trip/TripHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface JoinPageProps {
  params: Promise<{ id: string }>
}

export default async function JoinTripPage({ params }: JoinPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/trips/${id}/join`)}`)

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single()

  if (!trip) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😕</p>
        <p className="font-medium">ไม่พบทริปนี้</p>
      </div>
    )
  }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/trips/${id}`)
  }

  async function joinTrip() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('trip_members').insert({
      trip_id: id,
      user_id: user.id,
    })

    redirect(`/trips/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">เข้าร่วมทริป</h1>
        <p className="text-sm text-text-secondary mt-0.5">ยืนยันการเข้าร่วมทริปนี้</p>
      </div>

      <Card padding="lg">
        <TripHeader trip={trip} />
        <p className="text-sm text-text-secondary mt-4">
          เมื่อเข้าร่วมแล้ว คุณจะสามารถเลือกวันว่างและดูว่าเพื่อนว่างวันไหนบ้าง
        </p>

        <div className="flex gap-3 mt-6">
          <Link href="/dashboard" className="flex-1">
            <Button variant="secondary" className="w-full">ยกเลิก</Button>
          </Link>
          <form action={joinTrip} className="flex-1">
            <Button type="submit" className="w-full">เข้าร่วมทริป</Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
