'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Trip, Availability } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { DAY_NAMES_TH, MONTH_NAMES_TH } from '@/lib/constants'

interface AvailabilityHeatmapProps {
  trip: Trip
  currentUserId: string
  canConfirmDates: boolean
  onDateConfirmed?: () => void
}

interface DayData {
  day: number
  month: number
  year: number
  percentage: number
  count: number
  users: { id: string; name: string; color: string }[]
  isCurrentUserFree: boolean
}

export function AvailabilityHeatmap({
  trip,
  currentUserId,
  canConfirmDates,
  onDateConfirmed,
}: AvailabilityHeatmapProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [isSelectingDates, setIsSelectingDates] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [activeMonth, setActiveMonth] = useState(trip.month)
  const [activeYear, setActiveYear] = useState(trip.year)

  const supabase = useMemo(() => createClient(), [])

  // Fetch availabilities
  const fetchAvailabilities = useCallback(async () => {
    const { data } = await supabase
      .from('availabilities')
      .select('*, user:profiles(id, name, avatar_color)')
      .eq('trip_id', trip.id)

    if (data) {
      setAvailabilities(data as unknown as Availability[])
    }
  }, [trip.id, supabase])

  useEffect(() => {
    fetchAvailabilities()
  }, [fetchAvailabilities])

  // Realtime subscription with debounce
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const channel = supabase
      .channel(`availability-${trip.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availabilities',
          filter: `trip_id=eq.${trip.id}`,
        },
        () => {
          // Debounce refetch by 500ms
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            fetchAvailabilities()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [trip.id, supabase, fetchAvailabilities])

  // Calculate day data
  const dayDataMap = useMemo(() => {
    const activeMemberIds = new Set(
      trip.members?.filter((m) => m.rsvp_status === 'going').map((m) => m.user_id) || []
    )
    const totalMembers = activeMemberIds.size || 1

    const map = new Map<string, DayData>()

    availabilities.forEach((avail) => {
      const key = `${avail.year}-${avail.month}-${avail.day}`
      const existing = map.get(key)

      if (existing) {
        existing.count++
        if (avail.user) {
          existing.users.push({
            id: avail.user.id,
            name: avail.user.name,
            color: avail.user.avatar_color || '#5B6FF5',
          })
        }
        if (avail.user_id === currentUserId) {
          existing.isCurrentUserFree = true
        }
      } else {
        map.set(key, {
          day: avail.day,
          month: avail.month,
          year: avail.year,
          count: 1,
          percentage: 0,
          users: avail.user
            ? [
                {
                  id: avail.user.id,
                  name: avail.user.name,
                  color: avail.user.avatar_color || '#5B6FF5',
                },
              ]
            : [],
          isCurrentUserFree: avail.user_id === currentUserId,
        })
      }
    })

    // Calculate percentages
    map.forEach((data) => {
      data.percentage = (data.count / totalMembers) * 100
    })

    return map
  }, [availabilities, trip.members, currentUserId])

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const getHeatColor = (percentage: number) => {
    if (percentage === 0) return 'bg-white border-gray-200'
    if (percentage <= 25) return 'bg-teal-100 border-teal-200'
    if (percentage <= 50) return 'bg-teal-200 border-teal-300'
    if (percentage <= 75) return 'bg-teal-400 border-teal-500 text-white'
    return 'bg-teal-600 border-teal-700 text-white'
  }

  const handleConfirmDate = async () => {
    if (selectedDays.size === 0) {
      setToastMessage('กรุณาเลือกวันที่ต้องการยืนยัน')
      setShowToast(true)
      return
    }

    const selectedArray = Array.from(selectedDays).map((key) => {
      const [year, month, day] = key.split('-').map(Number)
      return { year, month, day }
    })

    selectedArray.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      if (a.month !== b.month) return a.month - b.month
      return a.day - b.day
    })

    const startDate = selectedArray[0]
    const endDate = selectedArray[selectedArray.length - 1]

    const startDateStr = `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(
      startDate.day
    ).padStart(2, '0')}`
    const endDateStr = `${endDate.year}-${String(endDate.month).padStart(2, '0')}-${String(
      endDate.day
    ).padStart(2, '0')}`

    if (!confirm(`ยืนยันวันที่ ${startDateStr} ถึง ${endDateStr}?`)) return

    setConfirming(true)

    const updates: Partial<Trip> = {
      start_date: startDateStr,
      end_date: endDateStr,
      date_mode: 'fixed',
    }

    // Also update status if still draft
    if (trip.status === 'draft') {
      updates.status = 'planning'
    }

    const { error } = await supabase.from('trips').update(updates).eq('id', trip.id)

    if (error) {
      setToastMessage('ยืนยันวันที่ไม่สำเร็จ')
      setShowToast(true)
    } else {
      setToastMessage('ยืนยันวันที่แล้ว!')
      setShowToast(true)
      setIsSelectingDates(false)
      setSelectedDays(new Set())
      onDateConfirmed?.()
    }

    setConfirming(false)
  }

  const toggleDaySelection = (day: number, month: number, year: number) => {
    const key = `${year}-${month}-${day}`
    const newSelected = new Set(selectedDays)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedDays(newSelected)
  }

  const daysInMonth = getDaysInMonth(activeMonth, activeYear)
  const firstDay = getFirstDayOfMonth(activeMonth, activeYear)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">ปฏิทินวันว่าง</h3>
          {canConfirmDates && trip.date_mode === 'flexible' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSelectingDates(!isSelectingDates)}
            >
              {isSelectingDates ? 'ยกเลิก' : 'ยืนยันวันที่'}
            </Button>
          )}
        </div>

        {/* Month selector */}
        {trip.months && trip.months.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {trip.months.map((m) => (
              <button
                key={`${m.year}-${m.month}`}
                onClick={() => {
                  setActiveMonth(m.month)
                  setActiveYear(m.year)
                }}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all whitespace-nowrap',
                  activeMonth === m.month && activeYear === m.year
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-200 text-text-secondary hover:border-gray-400'
                )}
              >
                {MONTH_NAMES_TH[m.month - 1]} {m.year}
              </button>
            ))}
          </div>
        )}

        {/* Calendar Grid */}
        <Card className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAY_NAMES_TH.map((name) => (
              <div key={name} className="text-center text-xs font-semibold text-text-secondary">
                {name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1
              const key = `${activeYear}-${activeMonth}-${day}`
              const dayData = dayDataMap.get(key)
              const isSelected = selectedDays.has(key)

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (isSelectingDates) {
                      toggleDaySelection(day, activeMonth, activeYear)
                    }
                  }}
                  disabled={!isSelectingDates}
                  className={cn(
                    'aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-semibold transition-all relative group',
                    isSelectingDates ? 'cursor-pointer hover:scale-105' : 'cursor-default',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                    dayData ? getHeatColor(dayData.percentage) : 'bg-white border-gray-200'
                  )}
                  title={
                    dayData
                      ? `${dayData.count} คน (${Math.round(dayData.percentage)}%)\n${dayData.users
                          .map((u) => u.name)
                          .join(', ')}`
                      : 'ยังไม่มีใครเลือกวันนี้'
                  }
                >
                  <span className={cn(dayData?.isCurrentUserFree && 'font-bold')}>{day}</span>
                  {dayData && dayData.isCurrentUserFree && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-text-secondary mb-2">สัญลักษณ์:</p>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 bg-white border-gray-200" />
                <span className="text-text-secondary">0%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 bg-teal-100 border-teal-200" />
                <span className="text-text-secondary">1-25%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 bg-teal-400 border-teal-500" />
                <span className="text-text-secondary">51-75%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 bg-teal-600 border-teal-700" />
                <span className="text-text-secondary">76-100%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 bg-white border-gray-200 relative">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full" />
                </div>
                <span className="text-text-secondary">คุณว่าง</span>
              </div>
            </div>
          </div>
        </Card>

        {isSelectingDates && (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleConfirmDate}
            loading={confirming}
            disabled={selectedDays.size === 0}
          >
            ยืนยัน {selectedDays.size} วันที่เลือก
          </Button>
        )}
      </div>

      {showToast && <Toast message={toastMessage} onClose={() => setShowToast(false)} />}
    </>
  )
}
