'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface DeleteTripButtonProps {
  tripId: string
  tripName: string
  variant?: 'button' | 'text'
}

export function DeleteTripButton({ tripId, tripName, variant = 'button' }: DeleteTripButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const handleDelete = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (error) {
      showToast('ไม่สามารถลบทริปได้', 'error')
      setLoading(false)
      setConfirming(false)
      return
    }

    showToast('ลบทริปแล้ว')
    router.push('/dashboard')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-sm text-foreground">
          ลบทริป <span className="font-semibold">&quot;{tripName}&quot;</span> ถาวร?<br />
          <span className="text-text-secondary">ข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => setConfirming(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            loading={loading}
            onClick={handleDelete}
          >
            ลบทริป
          </Button>
        </div>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setConfirming(true)
        }}
        className="text-xs text-red-500 hover:text-red-600 font-medium"
      >
        ลบทริป
      </button>
    )
  }

  return (
    <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
      ลบทริป
    </Button>
  )
}
