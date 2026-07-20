'use client'

import { useState, useEffect, useMemo } from 'react'
import { Trip, TripMember, TripRole } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MemberAvatar } from './MemberAvatar'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'

interface MemberListWithRSVPProps {
  trip: Trip
  currentUserId: string
  currentUserRole: TripRole
  onMemberRemoved?: () => void
}

export function MemberListWithRSVP({
  trip,
  currentUserId,
  currentUserRole,
  onMemberRemoved,
}: MemberListWithRSVPProps) {
  const [members, setMembers] = useState<TripMember[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const supabase = useMemo(() => createClient(), [])
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'co_organizer'

  // Filter active members
  useEffect(() => {
    if (trip.members) {
      setMembers(trip.members.filter((m) => m.rsvp_status !== 'removed'))
    }
  }, [trip.members])

  // Realtime subscription for member changes
  useEffect(() => {
    const channel = supabase
      .channel(`trip-members-${trip.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${trip.id}`,
        },
        async () => {
          // Refetch members
          const { data } = await supabase
            .from('trip_members')
            .select('*, user:profiles(*)')
            .eq('trip_id', trip.id)
            .neq('rsvp_status', 'removed')

          if (data) {
            setMembers(data as unknown as TripMember[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [trip.id, supabase])

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`ลบ ${memberName} ออกจากทริปนี้?`)) return

    setRemovingMemberId(memberId)

    const { error } = await supabase
      .from('trip_members')
      .update({ rsvp_status: 'removed' })
      .eq('id', memberId)

    if (error) {
      setToastMessage('ลบสมาชิกไม่สำเร็จ')
      setShowToast(true)
    } else {
      setToastMessage('ลบสมาชิกออกจากทริปแล้ว')
      setShowToast(true)
      onMemberRemoved?.()
    }

    setRemovingMemberId(null)
  }

  const handleCopyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${trip.invite_code}`
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setToastMessage('คัดลอกลิงก์เชิญแล้ว!')
      setShowToast(true)
      setShowInviteModal(false)
    } catch (err) {
      setToastMessage('คัดลอกไม่สำเร็จ')
      setShowToast(true)
    }
  }

  const getRSVPBadgeVariant = (status: string) => {
    switch (status) {
      case 'going':
        return 'success'
      case 'maybe':
        return 'warning'
      case 'not_going':
        return 'muted'
      default:
        return 'default'
    }
  }

  const getRSVPLabel = (status: string) => {
    switch (status) {
      case 'going':
        return 'ไปแน่นอน'
      case 'maybe':
        return 'อาจจะไป'
      case 'not_going':
        return 'ไม่ไป'
      case 'pending':
        return 'รอตอบกลับ'
      default:
        return status
    }
  }

  const getRoleLabel = (role: TripRole) => {
    switch (role) {
      case 'owner':
        return 'เจ้าของทริป'
      case 'co_organizer':
        return 'ผู้จัดการ'
      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            สมาชิก ({members.length} คน)
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInviteModal(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เชิญเพื่อน
          </Button>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const isOwner = member.role === 'owner'
            const isCurrentUser = member.user_id === currentUserId
            const canKick = canManageMembers && !isOwner && !isCurrentUser

            return (
              <Card key={member.id} className="p-3">
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    profile={member.user || null}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {member.user?.name || 'Unknown'}
                        {isCurrentUser && (
                          <span className="text-text-secondary ml-1">(คุณ)</span>
                        )}
                      </p>
                      {getRoleLabel(member.role) && (
                        <Badge variant="primary" size="sm">
                          {getRoleLabel(member.role)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRSVPBadgeVariant(member.rsvp_status)} size="sm">
                        {getRSVPLabel(member.rsvp_status)}
                      </Badge>
                      {member.rsvp_updated_at && (
                        <span className="text-xs text-text-secondary">
                          {new Date(member.rsvp_updated_at).toLocaleDateString('th-TH', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {canKick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleKickMember(member.id, member.user?.name || 'Unknown')}
                      loading={removingMemberId === member.id}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">เชิญเพื่อนเข้าร่วมทริป</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-text-secondary hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-2">รหัสเชิญ</p>
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <code className="flex-1 font-mono text-sm font-bold text-foreground">
                    {trip.invite_code}
                  </code>
                </div>
              </div>

              <div>
                <p className="text-sm text-text-secondary mb-2">ลิงก์เชิญ</p>
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <p className="flex-1 text-xs text-foreground truncate">
                    {window.location.origin}/invite/{trip.invite_code}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleCopyInviteLink}
              >
                คัดลอกลิงก์
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}
