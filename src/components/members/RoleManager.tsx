'use client'

import { useState } from 'react'
import { Trip, TripMember, TripRole } from '@/types'
import { MemberAvatar } from '@/components/members/MemberAvatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'

interface RoleManagerProps {
  trip: Trip
  currentUserId: string
  currentUserRole: TripRole
  onRoleUpdated: () => void
}

export function RoleManager({ trip, currentUserId, currentUserRole, onRoleUpdated }: RoleManagerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const isOwner = currentUserRole === 'owner'

  const handleUpdateRole = async (member: TripMember, newRole: TripRole) => {
    if (!isOwner) return
    if (member.role === 'owner') {
      setError('ไม่สามารถเปลี่ยนบทบาทของเจ้าของทริปได้')
      return
    }

    setUpdatingId(member.id)
    setError(null)

    const { error: updateError } = await supabase
      .from('trip_members')
      .update({ role: newRole })
      .eq('id', member.id)

    setUpdatingId(null)

    if (updateError) {
      setError('ไม่สามารถอัปเดตบทบาทได้')
    } else {
      onRoleUpdated()
    }
  }

  const roleText = (role: TripRole) => {
    switch (role) {
      case 'owner':
        return 'ผู้สร้างทริป'
      case 'co_organizer':
        return 'ผู้ร่วมจัดทริป'
      default:
        return 'ผู้เข้าร่วม'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
      <h3 className="font-bold text-lg text-foreground">จัดการบทบาทสมาชิก</h3>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="divide-y divide-border">
        {trip.members?.map((member) => {
          const profile = member.user
          if (!profile) return null

          const isSelf = member.user_id === currentUserId
          const canManage = isOwner && member.role !== 'owner'

          return (
            <div key={member.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <MemberAvatar profile={profile} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {profile.name} {isSelf && <span className="text-primary text-xs">(คุณ)</span>}
                  </p>
                  <p className="text-xs text-text-secondary">{roleText(member.role)}</p>
                </div>
              </div>

              {canManage ? (
                <div className="flex gap-1.5">
                  {member.role === 'co_organizer' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={updatingId === member.id}
                      onClick={() => handleUpdateRole(member, 'member')}
                    >
                      ยกเลิกผู้ร่วมจัด
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={updatingId === member.id}
                      onClick={() => handleUpdateRole(member, 'co_organizer')}
                    >
                      ตั้งเป็นผู้ร่วมจัด
                    </Button>
                  )}
                </div>
              ) : (
                <Badge variant={member.role === 'owner' ? 'primary' : member.role === 'co_organizer' ? 'success' : 'default'}>
                  {roleText(member.role)}
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
