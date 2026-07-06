import { cn, getHeatLevel } from '@/lib/utils'
import { Profile } from '@/types'

interface CalendarDayProps {
  day: number
  mode: 'edit' | 'heatmap'
  selected?: boolean
  count?: number
  totalMembers?: number
  users?: Profile[]
  onToggle?: (day: number) => void
}

const HEAT_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-white text-foreground',
  1: 'bg-indigo-100 text-foreground',
  2: 'bg-indigo-200 text-foreground',
  3: 'bg-indigo-400 text-white',
  4: 'bg-indigo-600 text-white',
}

export function CalendarDay({
  day,
  mode,
  selected,
  count = 0,
  totalMembers = 1,
  users = [],
  onToggle,
}: CalendarDayProps) {
  const heatLevel = mode === 'heatmap' ? getHeatLevel(count, totalMembers) : 0

  const handleClick = () => {
    if (mode === 'edit' && onToggle) onToggle(day)
  }

  const cell = (
    <button
      type="button"
      onClick={handleClick}
      disabled={mode === 'heatmap'}
      className={cn(
        'aspect-square flex items-center justify-center text-sm rounded-lg border border-border/50',
        'transition-all duration-150',
        mode === 'edit' && 'cursor-pointer hover:border-primary/50',
        mode === 'edit' && selected && 'bg-primary text-white border-primary hover:bg-primary-hover',
        mode === 'edit' && !selected && 'bg-white hover:bg-indigo-50',
        mode === 'heatmap' && HEAT_CLASSES[heatLevel],
        mode === 'heatmap' && 'cursor-default',
      )}
    >
      {day}
    </button>
  )

  if (mode === 'heatmap' && users.length > 0) {
    return (
      <div className="relative group">
        {cell}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
            <p className="font-medium mb-0.5">{count} คนว่าง</p>
            {users.map(u => (
              <p key={u.id}>{u.name}</p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return cell
}
