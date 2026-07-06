import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MemberAvatarProps {
  profile: Profile
  size?: 'sm' | 'md' | 'lg'
}

export function MemberAvatar({ profile, size = 'md' }: MemberAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white flex-shrink-0',
        {
          'w-6 h-6 text-xs': size === 'sm',
          'w-8 h-8 text-sm': size === 'md',
          'w-10 h-10 text-base': size === 'lg',
        }
      )}
      style={{ backgroundColor: profile.avatar_color }}
      title={profile.name}
    >
      {getInitials(profile.name)}
    </div>
  )
}
