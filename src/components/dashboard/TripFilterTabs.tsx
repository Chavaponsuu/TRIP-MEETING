/**
 * TripFilterTabs - 3 tabs with trip counts
 */

'use client'

import { cn } from '@/lib/utils'

export type TripFilter = 'going' | 'completed'

interface TripFilterTabsProps {
  activeFilter: TripFilter
  onFilterChange: (filter: TripFilter) => void
  counts: {
    going: number
    completed: number
  }
}

export function TripFilterTabs({ activeFilter, onFilterChange, counts }: TripFilterTabsProps) {
  const tabs: { key: TripFilter; label: string }[] = [
    { key: 'going', label: 'กำลังจะไป' },
    { key: 'completed', label: 'ผ่านไปแล้ว' },
  ]

  return (
    <div className="flex gap-2 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={cn(
            'px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-150',
            'border-b-2 -mb-px',
            activeFilter === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-foreground hover:border-gray-300'
          )}
        >
          {tab.label}
          {counts[tab.key] > 0 && (
            <span
              className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-xs font-bold',
                activeFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-text-secondary'
              )}
            >
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
