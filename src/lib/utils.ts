import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MONTH_NAMES_TH } from './constants'
import type { Trip, TripMonth } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(day: number, month: number, year: number): string {
  return `${day} ${MONTH_NAMES_TH[month - 1]} ${year}`
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month - 1, 1).getDay()
}

export function getHeatLevel(count: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  const ratio = count / total
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function getRandomAvatarColor(): string {
  const colors = ['#E07B54', '#5B8DEF', '#6CC47A', '#B07FE8', '#E8A838', '#4EC9C9']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'เมื่อสักครู่'
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`
  return date.toLocaleDateString('th-TH')
}

export function getTripMonths(trip: Pick<Trip, 'month' | 'year' | 'months'>): TripMonth[] {
  if (trip.months && trip.months.length > 0) {
    return [...trip.months].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month))
  }
  return [{ month: trip.month, year: trip.year }]
}

export function isTripPast(trip: Pick<Trip, 'month' | 'year' | 'months'>): boolean {
  const months = getTripMonths(trip)
  const last = months[months.length - 1]
  const lastDay = getDaysInMonth(last.month, last.year)
  const tripEnd = new Date(last.year, last.month - 1, lastDay, 23, 59, 59, 999)
  return tripEnd < new Date()
}

export function formatTripMonthRange(trip: Pick<Trip, 'month' | 'year' | 'months'>): string {
  const months = getTripMonths(trip)
  if (months.length === 1) {
    return `${MONTH_NAMES_TH[months[0].month - 1]} ${months[0].year}`
  }
  const first = months[0]
  const last = months[months.length - 1]
  return `${MONTH_NAMES_TH[first.month - 1]} ${first.year} – ${MONTH_NAMES_TH[last.month - 1]} ${last.year}`
}
