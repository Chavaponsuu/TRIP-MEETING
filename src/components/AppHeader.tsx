'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import { useTripInvitations } from '@/hooks/useTripInvitations'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { profile, user, signOut } = useAuth()
  const { incomingRequests } = useFriends(user?.id)
  const { pendingCount: tripInviteCount } = useTripInvitations(user?.id)
  const notificationCount = incomingRequests.length + tripInviteCount

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          TripMeet
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/friends"
            className={cn(
              'relative p-2.5 rounded-full text-text-secondary hover:text-foreground hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation',
            )}
            title="เพื่อน"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
          {profile && (
            <>
              <span className="text-sm text-text-secondary hidden sm:block max-w-[100px] truncate">{profile.name}</span>
              <button 
                onClick={signOut}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                title="ออกจากระบบ"
              >
                <MemberAvatar profile={profile} size="sm" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
