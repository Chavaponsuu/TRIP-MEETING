/**
 * DashboardSkeleton - Loading skeleton for dashboard
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-28 bg-gray-200 rounded-lg" />
          <div className="h-11 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-32 bg-gray-200 rounded-t" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="h-32 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="flex items-center justify-between">
                <div className="flex gap-[-8px]">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-8 h-8 bg-gray-200 rounded-full" />
                  ))}
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
