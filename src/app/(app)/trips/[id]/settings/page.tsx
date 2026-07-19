'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTrip } from '@/hooks/useTrip'
import { useAuth } from '@/hooks/useAuth'
import { RoleManager } from '@/components/members/RoleManager'
import { DateConfirmModal } from '@/components/trip/DateConfirmModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'

export default function TripSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string
  
  const { user } = useAuth()
  const { trip, loading, error, refetch } = useTrip(tripId)
  
  const [budget, setBudget] = useState<string>('')
  const [budgetCurrency, setBudgetCurrency] = useState<string>('THB')
  const [savingBudget, setSavingBudget] = useState(false)
  const [budgetMsg, setBudgetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const supabase = createClient()

  // Set initial budget values once trip is loaded
  useState(() => {
    if (trip) {
      setBudget(trip.budget ? String(trip.budget) : '')
      setBudgetCurrency(trip.currency || 'THB')
    }
  })

  // Handle budget updates when trip is fetched
  const handleBudgetSync = () => {
    if (trip && budget === '') {
      setBudget(trip.budget ? String(trip.budget) : '')
      setBudgetCurrency(trip.currency || 'THB')
    }
  }
  useMemo(handleBudgetSync, [trip])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😕</p>
        <p className="font-medium text-foreground">{error ?? 'ไม่พบทริปนี้'}</p>
        <Link href="/dashboard">
          <Button className="mt-4">กลับไปแดชบอร์ด</Button>
        </Link>
      </div>
    )
  }

  // Find user member role
  const memberRelation = trip.members?.find((m) => m.user_id === user?.id)
  const userRole = memberRelation?.role

  // Only Owner and Co-Organizer can access settings
  if (!userRole || (userRole !== 'owner' && userRole !== 'co_organizer')) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="font-medium text-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <p className="text-sm text-text-secondary">เฉพาะผู้สร้างทริปหรือผู้ร่วมจัดเท่านั้นที่เข้าได้</p>
        <Link href={`/trips/${tripId}`}>
          <Button variant="secondary">กลับไปหน้ารายละเอียดทริป</Button>
        </Link>
      </div>
    )
  }

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBudget(true)
    setBudgetMsg(null)

    const parsedBudget = budget.trim() === '' ? null : parseFloat(budget)

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        budget: parsedBudget,
        currency: budgetCurrency
      })
      .eq('id', trip.id)

    setSavingBudget(false)
    if (updateError) {
      setBudgetMsg({ type: 'error', text: 'ไม่สามารถบันทึกงบประมาณได้' })
    } else {
      setBudgetMsg({ type: 'success', text: 'บันทึกงบประมาณสำเร็จ!' })
      refetch()
    }
  }

  const formatConfirmDate = (dStr?: string | null) => {
    if (!dStr) return '-'
    const d = new Date(dStr)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link 
          href={`/trips/${tripId}`} 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-semibold transition-colors group touch-manipulation"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>กลับไปรายละเอียดทริป</span>
        </Link>
        <Badge variant={trip.status === 'confirmed' ? 'primary' : 'default'}>
          {trip.status === 'confirmed' ? 'ยืนยันวันแล้ว' : 'กำลังเสนอแนะ'}
        </Badge>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">ตั้งค่าทริป: {trip.emoji} {trip.name}</h2>
        <p className="text-sm text-text-secondary">จัดการวันเดินทาง สมาชิก และงบประมาณ</p>
      </div>

      {/* 1. Date Confirmation Settings */}
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground">จัดการวันเดินทาง</h3>
            <p className="text-sm text-text-secondary">
              สถานะ: {trip.date_mode === 'fixed' ? 'ระบุวันแน่นอน' : 'วันเวลาแบบยืดหยุ่น'}
            </p>
            {trip.date_mode === 'fixed' && (
              <p className="text-sm font-semibold text-primary">
                วันเดินทาง: {formatConfirmDate(trip.start_date)} - {formatConfirmDate(trip.end_date)}
              </p>
            )}
          </div>
          
          <Button 
            variant={trip.date_mode === 'fixed' ? 'secondary' : 'primary'}
            onClick={() => setIsConfirmModalOpen(true)}
          >
            {trip.date_mode === 'fixed' ? 'เปลี่ยนวันเดินทาง' : 'เลือกวันเดินทางที่ลงตัว'}
          </Button>
        </div>
      </Card>

      {/* 2. Budget Settings */}
      <Card className="p-4 space-y-4">
        <h3 className="font-bold text-lg text-foreground">ตั้งค่างบประมาณทริป</h3>
        <form onSubmit={handleUpdateBudget} className="space-y-3">
          {budgetMsg && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              budgetMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {budgetMsg.text}
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                placeholder="จำนวนงบประมาณ (เช่น 5000)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="border border-border rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={savingBudget}>
            บันทึกงบประมาณ
          </Button>
        </form>
      </Card>

      {/* 3. Role Manager Component */}
      <RoleManager 
        trip={trip}
        currentUserId={user?.id || ''}
        currentUserRole={userRole}
        onRoleUpdated={refetch}
      />

      {/* Confirm Date Modal */}
      <DateConfirmModal 
        trip={trip}
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
