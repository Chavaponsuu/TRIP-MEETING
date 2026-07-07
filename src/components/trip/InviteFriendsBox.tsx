'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'
import { Profile } from '@/types'
import { useFriends } from '@/hooks/useFriends'
import { useTripFriendInvites } from '@/hooks/useTripInvitations'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

interface InviteFriendsBoxProps {
  tripId: string
  memberIds: string[]
}

export function InviteFriendsBox({ tripId, memberIds }: InviteFriendsBoxProps) {
  const { user } = useAuth()
  const { friends, loading: friendsLoading } = useFriends(user?.id)
  const { pendingInviteeIds, sending, inviteFriend } = useTripFriendInvites(tripId, user?.id, memberIds)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const availableFriends = friends.filter(
    f => !memberIds.includes(f.id) && !pendingInviteeIds.includes(f.id)
  )
  const pendingFriends = friends.filter(f => pendingInviteeIds.includes(f.id))

  const handleInvite = async (friend: Profile) => {
    setInvitingId(friend.id)
    const { error } = await inviteFriend(friend.id)
    showToast(error ? 'ไม่สามารถส่งคำเชิญได้' : `ชวน ${friend.name} แล้ว!`)
    setInvitingId(null)
  }

  if (friendsLoading) {
    return (
      <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />
    )
  }

  if (friends.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">ชวนเพื่อนเข้าร่วมทริป</p>
        <p className="text-xs text-text-secondary">
          เพิ่มเพื่อนก่อนเพื่อชวนเข้าทริปโดยตรง — ไปที่หน้า{' '}
          <Link href="/friends" className="text-primary hover:underline">เพื่อน</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">ชวนเพื่อนเข้าร่วมทริป</p>

      {availableFriends.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {availableFriends.map(friend => (
            <li key={friend.id} className="flex items-center gap-3 px-3 py-2.5">
              <MemberAvatar profile={friend} size="md" />
              <span className="flex-1 text-sm font-medium truncate">{friend.name}</span>
              <Button
                size="sm"
                variant="secondary"
                loading={invitingId === friend.id}
                disabled={sending}
                onClick={() => handleInvite(friend)}
              >
                ชวน
              </Button>
            </li>
          ))}
        </ul>
      )}

      {pendingFriends.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary mb-1.5">รอตอบรับ</p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-gray-50">
            {pendingFriends.map(friend => (
              <li key={friend.id} className="flex items-center gap-3 px-3 py-2.5">
                <MemberAvatar profile={friend} size="md" />
                <span className="flex-1 text-sm text-text-secondary truncate">{friend.name}</span>
                <span className="text-xs text-text-secondary">ส่งคำเชิญแล้ว</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {availableFriends.length === 0 && pendingFriends.length === 0 && (
        <p className="text-xs text-text-secondary">เพื่อนทุกคนเป็นสมาชิกทริปนี้แล้ว</p>
      )}
    </div>
  )
}
