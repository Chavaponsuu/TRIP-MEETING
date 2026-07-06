import { Profile } from '@/types'

interface DayTooltipProps {
  day: number
  count: number
  users: Profile[]
  children: React.ReactNode
}

export function DayTooltip({ day, count, users, children }: DayTooltipProps) {
  if (count === 0) return <>{children}</>

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 shadow-lg min-w-[100px]">
          <p className="font-medium">วันที่ {day}</p>
          <p className="text-gray-300">{count} คนว่าง</p>
          {users.map(u => (
            <p key={u.id}>{u.name}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
