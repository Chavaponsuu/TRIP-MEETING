'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'

export function AppHeader() {
  const { profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          TripMeet
        </Link>
        <div className="flex items-center gap-3">
          {profile && (
            <>
              <span className="text-sm text-text-secondary hidden sm:block">{profile.name}</span>
              <MemberAvatar profile={profile} size="sm" />
            </>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            ออก
          </Button>
        </div>
      </div>
    </header>
  )
}
