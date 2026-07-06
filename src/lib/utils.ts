import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MONTH_NAMES_TH } from './constants'

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
