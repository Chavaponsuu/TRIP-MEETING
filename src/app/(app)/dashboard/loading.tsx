export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-gray-200 rounded-xl" />
      ))}
    </div>
  )
}
