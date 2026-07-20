/**
 * DashboardHeader - Header with UserAvatar, greeting, and action buttons
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/Button'
import { JoinByCodeModal } from './JoinByCodeModal'

interface DashboardHeaderProps {
  userName: string
  userId: string
}

export function DashboardHeader({ userName, userId }: DashboardHeaderProps) {
  const [showJoinModal, setShowJoinModal] = useState(false)

  // Extract nickname (first name) from full name
  const nickname = userName.split(' ')[0]

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Avatar + Greeting */}
        <div className="flex items-center gap-3">
          <UserAvatar name={userName} size={48} />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              สวัสดี 👋 {nickname}
            </h1>
            <p className="text-sm text-text-secondary">
              พร้อมวางแพลนทริปกับเพื่อนๆ แล้วหรือยัง?
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowJoinModal(true)}
            className="whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="hidden sm:inline">ใส่รหัสเชิญ</span>
            <span className="sm:hidden">รหัสเชิญ</span>
          </Button>

          <Link href="/trips/new">
            <Button variant="primary" size="md" className="whitespace-nowrap">
              <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">สร้างทริป</span>
              <span className="sm:hidden">ทริปใหม่</span>
            </Button>
          </Link>
        </div>
      </div>

      <JoinByCodeModal
        userId={userId}
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  )
}
