'use client'

import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Profile } from '@/types'

interface FriendListProps {
  friends: Profile[]
}

export function FriendList({ friends }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">👋</p>
        <p className="text-sm text-text-secondary">ยังไม่มีเพื่อน — ค้นหาและเพิ่มเพื่อนได้ด้านบน</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {friends.map(friend => (
        <li key={friend.id} className="flex items-center gap-3 py-3">
          <MemberAvatar profile={friend} size="md" />
          <span className="text-sm font-medium text-foreground">{friend.name}</span>
        </li>
      ))}
    </ul>
  )
}
