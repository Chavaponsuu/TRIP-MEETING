/**
 * EmptyState - Empty state for dashboard
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  variant: 'no-trips' | 'no-tab-results'
  tabName?: string
}

export function EmptyState({ variant, tabName }: EmptyStateProps) {
  if (variant === 'no-trips') {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-7xl mb-4">🗺️</div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          ยังไม่มีทริป
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
          สร้างทริปแล้วชวนเพื่อนมาเลือกวันว่างกัน หรือใส่รหัสเชิญเพื่อเข้าร่วมทริปของเพื่อน
        </p>
        <Link href="/trips/new">
          <Button variant="primary" size="lg">
            สร้างทริปแรกของคุณ
          </Button>
        </Link>
      </div>
    )
  }

  // no-tab-results
  const messages = {
    'กำลังจะไป': 'ยังไม่มีทริปที่กำลังจะไปตอนนี้',
    'ผ่านไปแล้ว': 'ยังไม่มีทริปที่เสร็จสิ้นแล้ว',
  }

  return (
    <div className="text-center py-12">
      <p className="text-text-secondary">
        {messages[tabName as keyof typeof messages] || 'ไม่มีทริปในหมวดนี้'}
      </p>
    </div>
  )
}
