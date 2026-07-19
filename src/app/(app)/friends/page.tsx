'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import { useTripInvitations } from '@/hooks/useTripInvitations'
import { FriendSearch } from '@/components/friends/FriendSearch'
import { FriendList } from '@/components/friends/FriendList'
import { FriendRequests } from '@/components/friends/FriendRequests'
import { TripInvitationList } from '@/components/friends/TripInvitationList'
import { Card } from '@/components/ui/Card'

export default function FriendsPage() {
  const { user } = useAuth()
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    sendRequest,
    respondToRequest,
    cancelRequest,
    searchProfiles,
    getRelationship,
  } = useFriends(user?.id)

  const {
    invitations,
    respondToInvitation,
    loading: invitesLoading,
  } = useTripInvitations(user?.id)

  const incomingFrom = (profileId: string) =>
    incomingRequests.find(r => r.sender_id === profileId)?.id

  if (loading || invitesLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-semibold transition-colors group mb-4 touch-manipulation"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>กลับไปแดชบอร์ด</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">เพื่อน</h1>
          <p className="text-sm text-text-secondary mt-1">
            {friends.length > 0
              ? `${friends.length} เพื่อน`
              : 'ค้นหาและเพิ่มเพื่อนเพื่อชวนเข้าทริปได้ง่ายขึ้น'}
          </p>
        </div>
      </div>

      {(invitations.length > 0 || incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <Card className="space-y-4">
          <TripInvitationList
            invitations={invitations}
            onRespond={respondToInvitation}
          />
          <FriendRequests
            incoming={incomingRequests}
            outgoing={outgoingRequests}
            onRespond={respondToRequest}
            onCancel={cancelRequest}
          />
        </Card>
      )}

      <Card>
        <FriendSearch
          searchProfiles={searchProfiles}
          getRelationship={getRelationship}
          onSendRequest={sendRequest}
          onAcceptRequest={(id) => respondToRequest(id, true)}
          incomingFrom={incomingFrom}
        />
      </Card>

      <Card>
        <p className="text-base font-semibold text-foreground mb-4">
          เพื่อนของฉัน ({friends.length})
        </p>
        <FriendList friends={friends} />
      </Card>
    </div>
  )
}
