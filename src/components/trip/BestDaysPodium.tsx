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
      <div className="text-center py-10 text-text-secondary">
        <p className="text-5xl mb-3">📅</p>
        <p className="font-semibold text-foreground">ยังไม่มีใครลงวันว่าง</p>
        <p className="text-sm mt-2">ชวนเพื่อนมาเลือกวันว่างกันเถอะ!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">วันที่ดีที่สุด</h3>
      <div className="space-y-2.5">
        {bestDays.slice(0, 5).map((day, index) => {
          const percentage = Math.round((day.count / totalMembers) * 100)
          
          return (
            <div
              key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${index}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-border hover:border-primary/30 hover:shadow-sm transition-all touch-manipulation"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-base font-bold text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">
                  {formatDate(day.day, day.month, day.year)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-secondary font-semibold whitespace-nowrap">
                    {day.count}/{totalMembers}
                  </span>
                </div>
              </div>
              <div className="flex -space-x-2">
                {day.users.slice(0, 3).map((user, userIndex) => (
                  <div
                    key={`${day.year ?? 'x'}-${day.month ?? 'x'}-${day.day}-${user.id}-${userIndex}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white shadow-sm"
                    style={{ backgroundColor: user.avatar_color || AVATAR_COLORS[0] }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {day.users.length > 3 && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-200 text-gray-700 border-2 border-white font-semibold shadow-sm">
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
