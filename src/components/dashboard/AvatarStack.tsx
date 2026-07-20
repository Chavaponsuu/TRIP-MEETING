/**
 * AvatarStack - Overlapping UserAvatar stack with +N indicator
 */

'use client'

import { UserAvatar } from '@/components/UserAvatar'
import type { Profile } from '@/types'

interface AvatarStackProps {
  users: Profile[]
  maxDisplay?: number
  size?: number
}

export function AvatarStack({ users, maxDisplay = 3, size = 32 }: AvatarStackProps) {
  const displayUsers = users.slice(0, maxDisplay)
  const remainingCount = Math.max(0, users.length - maxDisplay)

  if (users.length === 0) {
    return <div className="text-xs text-text-secondary">ยังไม่มีสมาชิก</div>
  }

  return (
    <div className="flex items-center">
      {displayUsers.map((user, index) => (
        <div
          key={user.id}
          className="relative border-2 border-white rounded-full"
          style={{
            marginLeft: index > 0 ? `-${size / 4}px` : '0',
            zIndex: displayUsers.length - index,
          }}
        >
          <UserAvatar name={user.name} size={size} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="relative flex items-center justify-center bg-gray-200 text-text-secondary text-xs font-bold rounded-full border-2 border-white"
          style={{
            width: size,
            height: size,
            marginLeft: `-${size / 4}px`,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
