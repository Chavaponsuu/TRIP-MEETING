'use client'

import { useState } from 'react'
import { ItineraryItemType, ItineraryItem } from '@/types'
import { Button } from '@/components/ui/Button'

interface ItineraryItemFormProps {
  isOpen: boolean
  onClose: () => void
  onCreateItem: (input: {
    day_number?: number | null
    item_type: ItineraryItemType
    title: string
    description?: string | null
    start_time?: string | null
    end_time?: string | null
    location?: string | null
  }) => Promise<{ data: ItineraryItem | null; error: string | null }>
  maxDays: number
}

const TYPE_OPTIONS: { value: ItineraryItemType; label: string; emoji: string; color: string }[] = [
  { value: 'activity', label: 'กิจกรรม', emoji: '🎭', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'travel', label: 'เดินทาง', emoji: '🚗', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'food', label: 'อาหาร', emoji: '🍜', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'accommodation', label: 'ที่พัก', emoji: '🏨', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'free_time', label: 'อิสระ', emoji: '🏖️', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
]

export function ItineraryItemForm({ isOpen, onClose, onCreateItem, maxDays }: ItineraryItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<ItineraryItemType>('activity')
  const [dayNumber, setDayNumber] = useState<string>('1')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('กรุณากรอกหัวข้อกิจกรรม')
      return
    }

    if (startTime && endTime && endTime <= startTime) {
      setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น')
      return
    }

    setLoading(true)
    setError(null)

    const parsedDay = dayNumber === 'unscheduled' ? null : parseInt(dayNumber)

    const { error: err } = await onCreateItem({
      title: title.trim(),
      description: description.trim() === '' ? null : description.trim(),
      item_type: itemType,
      day_number: parsedDay,
      start_time: startTime === '' ? null : startTime,
      end_time: endTime === '' ? null : endTime,
      location: location.trim() === '' ? null : location.trim(),
    })

    setLoading(false)

    if (err) {
      setError(err)
    } else {
      setTitle('')
      setDescription('')
      setItemType('activity')
      setDayNumber('1')
      setStartTime('')
      setEndTime('')
      setLocation('')
      onClose()
    }
  }

  const selectedType = TYPE_OPTIONS.find(o => o.value === itemType)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header with gradient accent */}
        <div className="relative px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-tl-3xl sm:rounded-tl-2xl rounded-tr-3xl sm:rounded-tr-2xl"
            style={{ background: 'linear-gradient(90deg, #5B6FF5, #818CF8, #A78BFA)' }}
          />
          <div className="flex justify-between items-start mt-1">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 leading-tight">เพิ่มกิจกรรมใหม่</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">เสนอแผนการเดินทางร่วมกับเพื่อนๆ ในกลุ่ม</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150 flex-shrink-0"
              aria-label="ปิด"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 pb-8">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Activity Type Pills */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">ประเภทกิจกรรม</label>
            <div className="grid grid-cols-5 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = itemType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setItemType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? `${opt.color} scale-[1.06] shadow-md`
                        : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl leading-none">{opt.emoji}</span>
                    <span className="text-[9px] font-bold leading-none">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              หัวข้อกิจกรรม <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">
                {selectedType?.emoji}
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ขึ้นเครื่องบิน, เช็คอินที่พัก, ทานมื้อค่ำ"
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 placeholder-gray-400 text-gray-800 transition-all duration-150"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">สถานที่</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">📍</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น สนามบินสุวรรณภูมิ, ร้านก๋วยเตี๋ยวชื่อดัง"
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 placeholder-gray-400 text-gray-800 transition-all duration-150"
              />
            </div>
          </div>

          {/* Day & Time row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">วันเดินทาง</label>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                className="w-full py-3 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 text-gray-800 font-semibold cursor-pointer transition-all duration-150"
              >
                <option value="unscheduled">ยังไม่ระบุ</option>
                {Array.from({ length: Math.max(1, maxDays) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>วันที่ {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">เวลาเริ่ม</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full py-3 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 text-gray-800 cursor-pointer transition-all duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">เวลาสิ้นสุด</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full py-3 px-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 text-gray-800 cursor-pointer transition-all duration-150"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น การแต่งกาย, ค่าใช้จ่าย, โน้ตส่วนตัว..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-indigo-400 placeholder-gray-400 text-gray-800 transition-all duration-150 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-sm font-bold text-white rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #5B6FF5 0%, #818CF8 100%)', boxShadow: '0 4px 15px rgba(91,111,245,0.35)' }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>เสนอกิจกรรมนี้</span>
              </>
            )}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
