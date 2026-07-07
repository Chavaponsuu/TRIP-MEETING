'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'
import { TripInvitation } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface TripInvitationListProps {
  invitations: TripInvitation[]
  onRespond: (invitationId: string, accept: boolean) => Promise<{ error?: string | null; tripId?: string }>
}

export function TripInvitationList({ invitations, onRespond }: TripInvitationListProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const { showToast } = useToast()
  const router = useRouter()

  // Filter out invitations without valid inviter or trip
  const validInvitations = invitations.filter(inv => inv.inviter && inv.trip)

  if (validInvitations.length === 0) return null

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setActionId(invitationId)
    const { error, tripId } = await onRespond(invitationId, accept)

    if (error) {
      showToast('เกิดข้อผิดพลาด', 'error')
    } else if (accept && tripId) {
      showToast('เข้าร่วมทริปแล้ว!', 'success')
      router.push(`/trips/${tripId}`)
    } else {
      showToast('ปฏิเสธคำเชิญแล้ว')
    }

    setActionId(null)
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">
        คำเชิญเข้าทริป ({validInvitations.length})
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {validInvitations.map(inv => (
          <li key={inv.id} className="px-3 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">{inv.trip?.emoji ?? '🗺️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{inv.trip?.name}</p>
                <p className="text-xs text-text-secondary truncate">{inv.trip?.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <MemberAvatar profile={inv.inviter} size="sm" />
              <span className="text-xs text-text-secondary flex-1">
                {inv.inviter?.name} ชวนคุณเข้าร่วม
              </span>
              <Button
                size="sm"
                loading={actionId === inv.id}
                onClick={() => handleRespond(inv.id, true)}
              >
                เข้าร่วม
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={actionId === inv.id}
                onClick={() => handleRespond(inv.id, false)}
              >
                ปฏิเสธ
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
