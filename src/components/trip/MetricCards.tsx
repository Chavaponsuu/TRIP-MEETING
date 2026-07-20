'use client'

import { Trip } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'

interface MetricCardsProps {
  trip: Trip
  goingCount: number
  canManage: boolean
  onTripUpdated?: () => void
}

export function MetricCards({ trip, goingCount, canManage, onTripUpdated }: MetricCardsProps) {
  const [copying, setCopying] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const supabase = createClient()

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatBudget = (budget: number | null | undefined, currency: string) => {
    if (!budget) return 'ยังไม่ระบุ'
    const formatted = new Intl.NumberFormat('th-TH').format(budget)
    if (currency === 'THB') return `${formatted} บาท/คน`
    return `${formatted} ${currency}/คน`
  }

  const handleCopyInviteCode = async () => {
    setCopying(true)
    const inviteUrl = `${window.location.origin}/invite/${trip.invite_code}`
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setToastMessage('คัดลอกลิงก์เชิญแล้ว!')
      setShowToast(true)
    } catch (err) {
      setToastMessage('คัดลอกไม่สำเร็จ')
      setShowToast(true)
    } finally {
      setCopying(false)
    }
  }

  const handleRegenerateInviteCode = async () => {
    if (!confirm('สร้างรหัสเชิญใหม่? ลิงก์เดิมจะใช้ไม่ได้อีกต่อไป')) return

    setRegenerating(true)
    
    // Generate new 8-character code
    const newCode = Math.random().toString(36).substring(2, 10)

    const { error } = await supabase
      .from('trips')
      .update({ invite_code: newCode })
      .eq('id', trip.id)

    if (error) {
      setToastMessage('สร้างรหัสใหม่ไม่สำเร็จ')
      setShowToast(true)
    } else {
      setToastMessage('สร้างรหัสเชิญใหม่แล้ว')
      setShowToast(true)
      onTripUpdated?.()
    }

    setRegenerating(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* วันที่ */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-secondary mb-1">วันที่</p>
              {trip.date_mode === 'flexible' ? (
                <div>
                  <p className="text-sm font-bold text-amber-600">รอโหวต</p>
                  <a
                    href="#availability"
                    className="text-xs text-primary hover:underline"
                  >
                    ไปเลือกวันว่าง →
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {trip.start_date && formatDate(trip.start_date)}
                  </p>
                  {trip.end_date && trip.end_date !== trip.start_date && (
                    <p className="text-xs text-text-secondary">
                      ถึง {formatDate(trip.end_date)}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* งบประมาณ */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-text-secondary mb-1">งบประมาณ</p>
              <p className="text-sm font-bold text-foreground">
                {formatBudget(trip.budget, trip.currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* รหัสเชิญ */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-text-secondary mb-1">รหัสเชิญ</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {trip.invite_code}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleCopyInviteCode}
                loading={copying}
              >
                คัดลอกลิงก์
              </Button>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={handleRegenerateInviteCode}
                  loading={regenerating}
                >
                  สร้างใหม่
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}
