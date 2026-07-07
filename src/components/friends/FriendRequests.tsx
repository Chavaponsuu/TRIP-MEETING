'use client'

import { useState } from 'react'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'
import { FriendRequest } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface FriendRequestsProps {
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  onRespond: (requestId: string, accept: boolean) => Promise<{ error?: string }>
  onCancel: (requestId: string) => Promise<{ error?: string }>
}

export function FriendRequests({ incoming, outgoing, onRespond, onCancel }: FriendRequestsProps) {
  const [actionId, setActionId] = useState<string | null>(null)
  const { showToast } = useToast()

  // Filter out requests without valid sender/receiver profiles
  const validIncoming = incoming.filter(req => req.sender)
  const validOutgoing = outgoing.filter(req => req.receiver)

  if (validIncoming.length === 0 && validOutgoing.length === 0) return null

  const handleRespond = async (requestId: string, accept: boolean) => {
    setActionId(requestId)
    const { error } = await onRespond(requestId, accept)
    showToast(
      error ? 'เกิดข้อผิดพลาด' : accept ? 'เป็นเพื่อนแล้ว!' : 'ปฏิเสธคำขอแล้ว',
      error ? 'error' : 'success'
    )
    setActionId(null)
  }

  const handleCancel = async (requestId: string) => {
    setActionId(requestId)
    const { error } = await onCancel(requestId)
    if (error) showToast('ไม่สามารถยกเลิกได้', 'error')
    setActionId(null)
  }

  return (
    <div className="space-y-4">
      {validIncoming.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            คำขอเป็นเพื่อน ({validIncoming.length})
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {validIncoming.map(req => (
              <li key={req.id} className="flex items-center gap-3 px-3 py-2.5">
                <MemberAvatar profile={req.sender} size="md" />
                <span className="flex-1 text-sm font-medium truncate">{req.sender?.name}</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    loading={actionId === req.id}
                    onClick={() => handleRespond(req.id, true)}
                  >
                    ยอมรับ
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionId === req.id}
                    onClick={() => handleRespond(req.id, false)}
                  >
                    ปฏิเสธ
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validOutgoing.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            รอตอบรับ ({validOutgoing.length})
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {validOutgoing.map(req => (
              <li key={req.id} className="flex items-center gap-3 px-3 py-2.5">
                <MemberAvatar profile={req.receiver} size="md" />
                <span className="flex-1 text-sm font-medium truncate">{req.receiver?.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={actionId === req.id}
                  onClick={() => handleCancel(req.id)}
                >
                  ยกเลิก
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
