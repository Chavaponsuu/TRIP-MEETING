import { TripMember, Availability } from '@/types'
import { MemberAvatar } from './MemberAvatar'
import { MONTH_NAMES_TH } from '@/lib/constants'

interface MemberListProps {
  members: TripMember[]
  availabilities: Availability[]
  month: number
  year: number
  activeMonth: number
  activeYear: number
}

export function MemberList({ members, availabilities, month, year, activeMonth, activeYear }: MemberListProps) {
  const getMemberDays = (userId: string): number[] => {
    return availabilities
      .filter(a => a.user_id === userId && a.month === activeMonth && a.year === activeYear)
      .map(a => a.day)
      .sort((a, b) => a - b)
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-text-secondary text-center py-8">
        ยังไม่มีสมาชิกในทริปนี้
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        สมาชิก ({members.length} คน)
      </h3>
      <div className="space-y-2">
        {members.map(member => {
          const days = getMemberDays(member.user_id)
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-border"
            >
              {member.user && <MemberAvatar profile={member.user} />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{member.user?.name}</p>
                {days.length > 0 ? (
                  <p className="text-xs text-text-secondary truncate">
                    ว่าง {days.length} วัน: {days.map(d => `${d} ${MONTH_NAMES_TH[activeMonth - 1].slice(0, 3)}`).join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-text-secondary">ยังไม่ได้เลือกวันว่าง</p>
                )}
              </div>
              <span className="text-xs text-text-secondary flex-shrink-0">
                {days.length} วัน
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
