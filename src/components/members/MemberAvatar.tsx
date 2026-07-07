import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AVATAR_COLORS } from '@/lib/constants'

interface MemberAvatarProps {
  profile: Profile | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export function MemberAvatar({ profile, size = 'md' }: MemberAvatarProps) {
  // Handle null/undefined profile
  if (!profile) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium text-white flex-shrink-0 bg-gray-400',
          {
            'w-6 h-6 text-xs': size === 'sm',
            'w-8 h-8 text-sm': size === 'md',
            'w-10 h-10 text-base': size === 'lg',
          }
        )}
        title="Unknown user"
      >
        ?
      </div>
    )
  }

  // Fallback to first color if avatar_color is null/undefined
  const backgroundColor = profile.avatar_color || AVATAR_COLORS[0]
  
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
      style={{ backgroundColor }}
      title={profile.name}
    >
      {getInitials(profile.name)}
    </div>
  )
}
