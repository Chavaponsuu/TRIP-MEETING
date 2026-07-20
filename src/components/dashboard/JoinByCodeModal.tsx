/**
 * JoinByCodeModal - Modal for joining trip via invite code
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface JoinByCodeModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function JoinByCodeModal({ userId, isOpen, onClose }: JoinByCodeModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || code.length !== 8) {
      setError('รหัสเชิญต้องมี 8 ตัวอักษร')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Find trip by invite code
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, name, emoji')
        .eq('invite_code', code.trim())
        .single()

      if (tripError || !trip) {
        setError('ไม่พบทริปนี้ ตรวจสอบรหัสอีกครั้ง')
        setLoading(false)
        return
      }

      // 2. Check if user is already a member
      const { data: existingMember } = await supabase
        .from('trip_members')
        .select('id, rsvp_status')
        .eq('trip_id', trip.id)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        if (existingMember.rsvp_status === 'removed') {
          setError('คุณถูกลบออกจากทริปนี้แล้ว')
          setLoading(false)
          return
        }
        // Already a member, just redirect
        router.push(`/trips/${trip.id}`)
        onClose()
        return
      }

      // 3. Join trip as member with 'going' status
      const { error: joinError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: trip.id,
          user_id: userId,
          role: 'member',
          rsvp_status: 'going',
        })

      if (joinError) throw joinError

      // Success - redirect to trip page
      router.push(`/trips/${trip.id}`)
      onClose()
    } catch (err) {
      console.error('Error joining trip:', err)
      setError('เกิดข้อผิดพลาดในการเข้าร่วมทริป')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">ใส่รหัสเชิญ</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-foreground transition-colors"
            aria-label="ปิด"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          กรอกรหัสเชิญ 8 ตัวอักษรที่ได้รับจากเพื่อนเพื่อเข้าร่วมทริป
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.trim().toUpperCase())
                setError(null)
              }}
              placeholder="เช่น ABC12345"
              maxLength={8}
              className={cn(
                'text-center text-lg font-mono tracking-wider uppercase',
                error && 'border-red-500'
              )}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
              disabled={!code.trim() || code.length !== 8}
            >
              เข้าร่วม
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
