import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>กรุณาเข้าสู่ระบบ</div>
  }

  // Fetch user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name || 'ผู้ใช้'

  return <DashboardClient userId={user.id} userName={userName} />
}
