'use client'

import { useState } from 'react'
import { Trip } from '@/types'
import { Button } from '@/components/ui/Button'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { createClient } from '@/lib/supabase/client'

interface DateConfirmModalProps {
  trip: Trip
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DateConfirmModal({ trip, isOpen, onClose, onSuccess }: DateConfirmModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('กรุณาเลือกทั้งวันเริ่มต้นและวันสิ้นสุด')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    // Call the database function: RPC confirm_trip_dates
    const { error: rpcError } = await supabase.rpc('confirm_trip_dates', {
      p_trip_id: trip.id,
      p_start_date: startDate,
      p_end_date: endDate
    })

    setLoading(false)

    if (rpcError) {
      setError(rpcError.message || 'ไม่สามารถยืนยันวันเดินทางได้')
    } else {
      setSuccessMsg('ยืนยันวันเดินทางเรียบร้อยแล้ว!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    }
  }

  // Format month and year for calendar rendering
  const activeMonth = trip.month
  const activeYear = trip.year

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-foreground">ยืนยันวันเดินทาง</h3>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-foreground text-xl p-1 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {/* Heatmap Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-secondary">ตารางสรุปความว่างของสมาชิก (Heatmap)</h4>
            <div className="border border-border p-3 rounded-xl bg-slate-50">
              <CalendarGrid
                trip={trip}
                mode="heatmap"
                activeMonth={activeMonth}
                activeYear={activeYear}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">วันเริ่มต้นเดินทาง</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">วันสิ้นสุดการเดินทาง</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                ยืนยันวันเดินทาง
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
