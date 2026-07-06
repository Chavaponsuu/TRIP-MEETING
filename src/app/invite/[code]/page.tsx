import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TripInvitePreview } from '@/types'
import { MONTH_NAMES_TH } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface InvitePageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params
  const supabase = await createClient()

  const { data: tripData } = await supabase.rpc('get_trip_by_invite', { invite: code })
  const trip = (Array.isArray(tripData) ? tripData[0] : tripData) as TripInvitePreview | null

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-foreground">ลิงก์ไม่ถูกต้อง</h1>
          <p className="text-sm text-text-secondary mt-2">ลิงก์ชวนนี้อาจหมดอายุหรือไม่มีอยู่</p>
          <Link href="/" className="inline-block mt-6">
            <Button variant="secondary">กลับหน้าแรก</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
      })
    }

    redirect(`/trips/${trip.id}`)
  }

  const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/${code}`)}`
  const registerUrl = `/register?redirect=${encodeURIComponent(`/invite/${code}`)}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">TripMeet</Link>
        </div>

        <Card padding="lg" className="text-center">
          <span className="text-5xl">{trip.emoji}</span>
          <h1 className="text-xl font-bold text-foreground mt-4">{trip.name}</h1>
          <p className="text-text-secondary mt-1">{trip.destination}</p>
          <p className="text-sm text-text-secondary mt-1">
            {MONTH_NAMES_TH[trip.month - 1]} {trip.year}
          </p>

          <p className="text-sm text-foreground mt-6 mb-6">
            คุณได้รับเชิญเข้าร่วมทริปนี้!<br />
            เข้าสู่ระบบเพื่อเริ่มเลือกวันว่าง
          </p>

          <div className="space-y-3">
            <Link href={loginUrl}>
              <Button className="w-full">เข้าสู่ระบบเพื่อเข้าร่วม</Button>
            </Link>
            <Link href={registerUrl}>
              <Button variant="secondary" className="w-full">สมัครสมาชิก</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
