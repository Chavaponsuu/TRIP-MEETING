'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

export function useAvailability(tripId: string, userId: string | undefined, onSave?: () => void) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    if (!userId) return

    const load = async () => {
      const { data, error } = await supabase
        .from('availabilities')
        .select('day, month, year')
        .eq('trip_id', tripId)
        .eq('user_id', userId)

      if (!error && data) {
        setSelectedDays(new Set(data.map(d => `${d.year}-${d.month}-${d.day}`)))
      }
      setLoading(false)
    }

    load()
  }, [tripId, userId, supabase])

  const toggleDay = useCallback((day: number, month: number, year: number) => {
    setSelectedDays(prev => {
      const next = new Set(prev)
      const key = `${year}-${month}-${day}`
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const save = useCallback(async () => {
    if (!userId) return
    setSaving(true)

    const { error: deleteError } = await supabase
      .from('availabilities')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId)

    if (deleteError) {
      showToast('ไม่สามารถบันทึกได้', 'error')
      setSaving(false)
      return
    }

    if (selectedDays.size > 0) {
      const { error: insertError } = await supabase
        .from('availabilities')
        .insert(
          Array.from(selectedDays).map(key => {
            const [year, month, day] = key.split('-').map(Number)
            return {
              trip_id: tripId,
              user_id: userId,
              day,
              month,
              year,
            }
          })
        )

      if (insertError) {
        showToast('ไม่สามารถบันทึกได้', 'error')
        setSaving(false)
        return
      }
    }

    showToast('บันทึกวันว่างแล้ว!')
    setSaving(false)
    if (onSave) {
      onSave()
    }
  }, [tripId, userId, selectedDays, supabase, showToast, onSave])

  return { selectedDays, toggleDay, save, loading, saving }
}
