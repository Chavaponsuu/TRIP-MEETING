import { DayAvailability } from '@/types'
import { formatDate } from '@/lib/utils'
import { AVATAR_COLORS } from '@/lib/constants'

interface BestDaysPodiumProps {
  bestDays: DayAvailability[]
  totalMembers: number
}

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
        {bestDays.slice(0, 5).map((day, index) => {
          const percentage = Math.round((day.count / totalMembers) * 100)
          
          return (
            <div
              key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-border hover:border-primary/20 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {formatDate(day.day, day.month, day.year)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary font-medium whitespace-nowrap">
                    {day.count}/{totalMembers}
                  </span>
                </div>
              </div>
              <div className="flex -space-x-1.5">
                {day.users.slice(0, 3).map((user, userIndex) => (
                  <div
                    key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${user.id}-${userIndex}`}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                    style={{ backgroundColor: user.avatar_color || AVATAR_COLORS[0] }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {day.users.length > 3 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-200 text-gray-600 border-2 border-white font-medium">
                    +{day.users.length - 3}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
