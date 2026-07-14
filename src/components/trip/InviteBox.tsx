'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface InviteBoxProps {
  inviteCode: string
}

export function InviteBox({ inviteCode }: InviteBoxProps) {
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      showToast('คัดลอกลิงก์แล้ว!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('ไม่สามารถคัดลอกได้', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">ชวนเพื่อนเข้าร่วมทริป</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 px-4 py-3 text-sm rounded-lg border-2 border-border bg-gray-50 text-text-secondary truncate min-h-[44px]"
        />
        <Button variant="secondary" onClick={handleCopy} className="shrink-0 min-w-[100px]">
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </Button>
      </div>
      <p className="text-sm text-text-secondary bg-blue-50 p-3 rounded-lg">
        💡 ส่งลิงก์นี้ให้เพื่อน เมื่อเปิดแล้ว login จะเข้าร่วมทริปได้ทันที
      </p>
    </div>
  )
}
