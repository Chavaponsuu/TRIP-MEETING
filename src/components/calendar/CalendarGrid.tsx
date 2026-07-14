'use client'

import { Trip, DayAvailability } from '@/types'
import { DAY_NAMES_TH, MONTH_NAMES_TH } from '@/lib/constants'
import { getDaysInMonth, getFirstDayOfMonth } from '@/lib/utils'
import { CalendarDay } from './CalendarDay'
import { HeatmapLegend } from './HeatmapLegend'

interface CalendarGridProps {
  trip: Trip
  mode: 'edit' | 'heatmap'
  selectedDays?: Set<string>
  onToggleDay?: (day: number) => void
  activeMonth: number
  activeYear: number
}

function buildDayAvailability(trip: Trip, month: number, year: number): Map<number, DayAvailability> {
  const map = new Map<number, DayAvailability>()
  const availabilities = trip.availabilities ?? []

  for (const avail of availabilities) {
    if (avail.month !== month || avail.year !== year) continue
    const existing = map.get(avail.day)
    if (existing) {
      existing.count++
      if (avail.user) existing.users.push(avail.user)
    } else {
      map.set(avail.day, {
        day: avail.day,
        month,
        year,
        count: 1,
        users: avail.user ? [avail.user] : [],
      })
    }
  }

  return map
}

export function CalendarGrid({ trip, mode, selectedDays, onToggleDay, activeMonth, activeYear }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(activeMonth, activeYear)
  const firstDay = getFirstDayOfMonth(activeMonth, activeYear)
  const totalMembers = trip.members?.length ?? 1
  const dayMap = buildDayAvailability(trip, activeMonth, activeYear)

  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} />
  ))

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayData = dayMap.get(day)
    const isSelected = selectedDays?.has(`${activeYear}-${activeMonth}-${day}`)

    return (
      <CalendarDay
        key={day}
        day={day}
        mode={mode}
        selected={isSelected}
        count={dayData?.count ?? 0}
        totalMembers={totalMembers}
        users={dayData?.users ?? []}
        onToggle={onToggleDay}
      />
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {MONTH_NAMES_TH[activeMonth - 1]} {activeYear}
        </h3>
        {mode === 'heatmap' && <HeatmapLegend />}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES_TH.map(name => (
          <div key={name} className="text-center text-sm font-semibold text-text-secondary py-2">
            {name}
          </div>
        ))}
        {blanks}
        {days}
      </div>

      {mode === 'edit' && (
        <p className="text-sm text-text-secondary text-center py-2 bg-indigo-50/50 rounded-lg">
          แตะวันที่ที่คุณว่าง {selectedDays && selectedDays.size > 0 && (
            <span className="font-medium text-primary">({selectedDays.size} วัน)</span>
          )}
        </p>
      )}
    </div>
  )
}

export function getBestDays(trip: Trip): DayAvailability[] {
  const dayMap = new Map<string, DayAvailability>()
  const availabilities = trip.availabilities ?? []

  for (const avail of availabilities) {
    const key = `${avail.year}-${avail.month}-${avail.day}`
    const existing = dayMap.get(key)
    if (existing) {
      // Only add the user if they're not already in the list (guards against
      // duplicate rows caused by missing month/year migration data)
      const alreadyAdded = avail.user && existing.users.some(u => u.id === avail.user!.id)
      if (!alreadyAdded) {
        existing.count++
        if (avail.user) existing.users.push(avail.user)
      }
    } else {
      dayMap.set(key, {
        day: avail.day,
        month: avail.month,
        year: avail.year,
        count: 1,
        users: avail.user ? [avail.user] : [],
      })
    }
  }

  return Array.from(dayMap.values()).sort((a, b) => b.count - a.count)
}
