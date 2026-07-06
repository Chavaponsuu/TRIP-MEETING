const LEVELS = [
  { level: 0, label: 'ไม่มีใครว่าง', class: 'bg-white border border-border' },
  { level: 1, label: '1-25%', class: 'bg-indigo-100' },
  { level: 2, label: '26-50%', class: 'bg-indigo-200' },
  { level: 3, label: '51-75%', class: 'bg-indigo-400' },
  { level: 4, label: '76-100%', class: 'bg-indigo-600' },
]

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-text-secondary">น้อย</span>
      {LEVELS.map(({ level, class: cls }) => (
        <div key={level} className={`w-5 h-5 rounded ${cls}`} title={LEVELS[level].label} />
      ))}
      <span className="text-xs text-text-secondary">มาก</span>
    </div>
  )
}
