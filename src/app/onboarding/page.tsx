'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function OnboardingPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debouncedNickname, setDebouncedNickname] = useState('')

  const supabase = createClient()

  // Debounce nickname for avatar preview (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nickname.trim()) {
        setDebouncedNickname(nickname.trim())
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [nickname])

  const validateNickname = (value: string): string | null => {
    const trimmed = value.trim()
    
    if (!trimmed) {
      return 'กรุณากรอกชื่อเล่น'
    }
    
    if (trimmed.length < 2) {
      return 'ชื่อเล่นต้องมีอย่างน้อย 2 ตัวอักษร'
    }
    
    if (trimmed.length > 20) {
      return 'ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateNickname(nickname)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('ไม่พบข้อมูลผู้ใช้')
        setLoading(false)
        return
      }

      // Update profile with nickname and mark onboarding complete
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: nickname.trim(),
          onboarded_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง')
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ยินดีต้อนรับสู่ TripMeet! 🎉</h1>
          <p className="text-text-secondary">เริ่มต้นด้วยการตั้งชื่อเล่นของคุณ</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {debouncedNickname ? (
                  <UserAvatar name={debouncedNickname} size={120} />
                ) : (
                  <div className="w-[120px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-text-secondary text-center">
                อวตาร์จะถูกสร้างจากชื่อเล่นของคุณโดยอัตโนมัติ
              </p>
            </div>

            {/* Nickname Input */}
            <div>
              <Input
                id="nickname"
                label="ชื่อเล่น"
                type="text"
                placeholder="เช่น แจ๊ค, นิ่ม, เจมส์"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
                autoFocus
              />
              <p className="text-xs text-text-secondary mt-1">
                {nickname.trim().length}/20 ตัวอักษร
              </p>
            </div>

            {/* Upload Button (Disabled) */}
            <div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                อัปโหลดรูปโปรไฟล์ (เร็วๆ นี้)
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              disabled={!nickname.trim() || nickname.trim().length < 2}
              className="w-full"
            >
              เริ่มใช้งาน
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
