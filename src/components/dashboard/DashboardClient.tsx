/**
 * DashboardClient - Main client component for dashboard page
 */

'use client'

import { useState } from 'react'
import { useMyTrips } from '@/hooks/useMyTrips'
import { DashboardHeader } from './DashboardHeader'
import { TripFilterTabs, TripFilter } from './TripFilterTabs'
import { TripCardGrid } from './TripCardGrid'
import { EmptyState } from './EmptyState'
import { DashboardSkeleton } from './DashboardSkeleton'

interface DashboardClientProps {
  userId: string
  userName: string
}

export function DashboardClient({ userId, userName }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<TripFilter>('going')
  const { trips, loading, error } = useMyTrips(userId)

  // Calculate counts
  const counts = {
    going: trips.going.length,
    completed: trips.completed.length,
  }

  const totalTrips = counts.going + trips.pending.length + counts.completed

  // Loading state
  if (loading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      </div>
    )
  }

  // No trips at all
  if (totalTrips === 0) {
    return (
      <div className="space-y-6">
        <DashboardHeader userName={userName} userId={userId} />
        <EmptyState variant="no-trips" />
      </div>
    )
  }

  // Get current filter's trips
  const currentTrips = trips[activeFilter]

  // Tab labels for empty state
  const tabLabels: Record<TripFilter, string> = {
    going: 'กำลังจะไป',
    completed: 'ผ่านไปแล้ว',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader userName={userName} userId={userId} />

      {/* Filter Tabs */}
      <TripFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Trip Grid */}
      {currentTrips.length === 0 ? (
        <EmptyState variant="no-tab-results" tabName={tabLabels[activeFilter]} />
      ) : (
        <TripCardGrid trips={currentTrips} />
      )}
    </div>
  )
}
