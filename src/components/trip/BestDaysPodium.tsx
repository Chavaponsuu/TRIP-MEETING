import { DayAvailability } from '@/types'
import { formatDate } from '@/lib/utils'

interface BestDaysPodiumProps {
  bestDays: DayAvailability[]
  totalMembers: number
}

const MEDALS = ['🥇', '🥈', '🥉']

export function BestDaysPodium({ bestDays, totalMembers }: BestDaysPodiumProps) {
  if (bestDays.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p className="text-4xl mb-2">📅</p>
        <p>ยังไม่มีใครลงวันว่าง</p>
        <p className="text-sm mt-1">ชวนเพื่อนมาเลือกวันว่างกันเถอะ!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">วันที่ดีที่สุด</h3>
      <div className="space-y-2">
        {bestDays.slice(0, 3).map((day, index) => (
          <div
            key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${index}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-border"
          >
            <span className="text-2xl">{MEDALS[index]}</span>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {formatDate(day.day, day.month, day.year)}
              </p>
              <p className="text-sm text-text-secondary">
                {day.count}/{totalMembers} คนว่าง
              </p>
            </div>
            <div className="flex -space-x-1">
              {day.users.slice(0, 3).map((user, userIndex) => (
                <div
                  key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${user.id}-${userIndex}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                  style={{ backgroundColor: user.avatar_color }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {day.users.length > 3 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-gray-200 text-gray-600 border-2 border-white">
                  +{day.users.length - 3}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
