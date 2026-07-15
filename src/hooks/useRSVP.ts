'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RSVPStatus } from '@/types'

export function useRSVP(tripId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const updateRSVP = useCallback(async (status: RSVPStatus): Promise<{ error: string | null }> => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return { error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
    }

    const { error: updateError } = await supabase
      .from('trip_members')
      .update({
        rsvp_status: status,
        rsvp_updated_at: new Date().toISOString()
      })
      .eq('trip_id', tripId)
      .eq('user_id', user.id)

    setLoading(false)
    if (updateError) {
      setError('ไม่สามารถอัปเดตสถานะ RSVP ได้')
      return { error: 'ไม่สามารถอัปเดตสถานะ RSVP ได้' }
    }

    return { error: null }
  }, [tripId, supabase])

  const sendReminders = useCallback(async (): Promise<{ count: number; error: string | null }> => {
    setLoading(true)
    setError(null)

    // Fetch members of this trip with 'maybe' or 'pending' status
    const { data: members, error: fetchError } = await supabase
      .from('trip_members')
      .select('id, user_id, rsvp_status, reminder_sent_at')
      .eq('trip_id', tripId)
      .in('rsvp_status', ['maybe', 'pending'])

    if (fetchError) {
      setLoading(false)
      setError('ไม่สามารถดึงข้อมูลสมาชิกเพื่อส่งการแจ้งเตือนได้')
      return { count: 0, error: 'ไม่สามารถดึงข้อมูลสมาชิกเพื่อส่งการแจ้งเตือนได้' }
    }

    const now = new Date()
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    // Filter out recently reminded members (within 48 hours)
    const membersToRemind = (members ?? []).filter(m => {
      if (!m.reminder_sent_at) return true
      const lastSent = new Date(m.reminder_sent_at)
      return lastSent < fortyEightHoursAgo
    })

    if (membersToRemind.length === 0) {
      setLoading(false)
      return { count: 0, error: null }
    }

    let sentCount = 0
    // Send reminders: Update reminder_sent_at in database
    for (const member of membersToRemind) {
      const { error: updateError } = await supabase
        .from('trip_members')
        .update({
          reminder_sent_at: now.toISOString()
        })
        .eq('id', member.id)

      if (!updateError) {
        sentCount++
      }
    }

    setLoading(false)
    return { count: sentCount, error: null }
  }, [tripId, supabase])

  return {
    updateRSVP,
    sendReminders,
    loading,
    error
  }
}
