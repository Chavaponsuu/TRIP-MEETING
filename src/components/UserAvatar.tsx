/**
 * UserAvatar - DiceBear avatar component
 * Uses Lorelei style with user's name as seed
 * HTTP API approach for lightweight implementation
 */

import Image from 'next/image'

interface UserAvatarProps {
  name: string
  size?: number
  className?: string
}

export function UserAvatar({ name, size = 40, className = '' }: UserAvatarProps) {
  // DiceBear HTTP API v10 with lorelei style
  const src = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(name)}&size=${size}`

  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt={`อวตาร์ของ ${name}`}
      className={`rounded-full ${className}`}
      unoptimized // SVG from external API doesn't need optimization
    />
  )
}
