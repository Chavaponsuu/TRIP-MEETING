'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Profile } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface FriendSearchProps {
  searchProfiles: (query: string) => Promise<Profile[]>
  getRelationship: (profileId: string) => 'friend' | 'pending_sent' | 'pending_received' | 'none'
  onSendRequest: (receiverId: string) => Promise<{ error?: string }>
  onAcceptRequest: (requestId: string) => Promise<{ error?: string }>
  incomingFrom: (profileId: string) => string | undefined
}

export function FriendSearch({
  searchProfiles,
  getRelationship,
  onSendRequest,
  onAcceptRequest,
  incomingFrom,
}: FriendSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleSearch = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    const profiles = await searchProfiles(query)
    setResults(profiles)
    setSearching(false)
  }

  const handleAction = async (profile: Profile) => {
    const rel = getRelationship(profile.id)
    setActionId(profile.id)

    if (rel === 'pending_received') {
      const requestId = incomingFrom(profile.id)
      if (requestId) {
        const { error } = await onAcceptRequest(requestId)
        showToast(error ? 'ไม่สามารถยอมรับได้' : 'เป็นเพื่อนแล้ว!', error ? 'error' : 'success')
      }
    } else if (rel === 'none') {
      const { error } = await onSendRequest(profile.id)
      showToast(error ? 'ไม่สามารถส่งคำขอได้' : 'ส่งคำขอเป็นเพื่อนแล้ว')
    }

    setActionId(null)
    if (query.trim().length >= 2) {
      const profiles = await searchProfiles(query)
      setResults(profiles)
    }
  }

  const actionLabel = (profileId: string) => {
    const rel = getRelationship(profileId)
    switch (rel) {
      case 'friend': return 'เป็นเพื่อนแล้ว'
      case 'pending_sent': return 'รอตอบรับ'
      case 'pending_received': return 'ยอมรับ'
      default: return 'เพิ่มเพื่อน'
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">ค้นหาเพื่อน</p>
      <div className="flex gap-2">
        <Input
          placeholder="ค้นหาด้วยชื่อ..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="secondary" onClick={handleSearch} loading={searching}>
          ค้นหา
        </Button>
      </div>

      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {results.map(profile => {
            const rel = getRelationship(profile.id)
            const disabled = rel === 'friend' || rel === 'pending_sent'

            return (
              <li key={profile.id} className="flex items-center gap-3 px-3 py-2.5">
                <MemberAvatar profile={profile} size="md" />
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {profile.name}
                </span>
                <Button
                  size="sm"
                  variant={rel === 'pending_received' ? 'primary' : 'secondary'}
                  disabled={disabled}
                  loading={actionId === profile.id}
                  onClick={() => handleAction(profile)}
                >
                  {actionLabel(profile.id)}
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {results.length === 0 && query.trim().length >= 2 && !searching && (
        <p className="text-sm text-text-secondary text-center py-2">ไม่พบผู้ใช้</p>
      )}
    </div>
  )
}
