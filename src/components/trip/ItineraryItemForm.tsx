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

const TYPE_OPTIONS: { value: ItineraryItemType; label: string; emoji: string }[] = [
  { value: 'activity', label: 'กิจกรรม', emoji: '🎭' },
  { value: 'travel', label: 'เดินทาง', emoji: '🚗' },
  { value: 'food', label: 'อาหาร', emoji: '🍜' },
  { value: 'accommodation', label: 'ที่พัก', emoji: '🏨' },
  { value: 'free_time', label: 'เวลาอิสระ', emoji: '🏖️' }
]

export function ItineraryItemForm({ isOpen, onClose, onCreateItem, maxDays }: ItineraryItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<ItineraryItemType>('activity')
  const [dayNumber, setDayNumber] = useState<string>('1') // default to Day 1
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
      location: location.trim() === '' ? null : location.trim()
    })

    setLoading(false)

    if (err) {
      setError(err)
    } else {
      // Success: Reset form and close
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-t-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
      >
        {/* Handle bar for bottom sheet look */}
        <div className="w-full flex justify-center py-2 bg-gray-50 border-b border-border">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-white">
          <h3 className="text-base font-bold text-foreground">เพิ่มกิจกรรมการเดินทาง</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-text-secondary hover:text-foreground text-sm font-semibold p-1"
          >
            ยกเลิก
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 pb-8">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Activity Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">ประเภทกิจกรรม</label>
            <div className="grid grid-cols-5 gap-1">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = itemType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setItemType(opt.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'border-primary bg-indigo-50/20 text-primary scale-105'
                        : 'border-border text-foreground hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">หัวข้อกิจกรรม</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ขึ้นเครื่องบิน, เช็คอินที่พัก, ทานมื้อค่ำ"
              className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">สถานที่</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น สนามบินสุวรรณภูมิ, ร้านก๋วยเตี๋ยวชื่อดัง"
              className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Day Number and Times */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">วันเดินทาง</label>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 text-sm bg-white focus:outline-none"
              >
                <option value="unscheduled">ยังไม่กำหนดวัน</option>
                {Array.from({ length: Math.max(1, maxDays) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    วันที่ {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">เวลาเริ่ม</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary">เวลาสิ้นสุด</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">รายละเอียดอื่นๆ</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุข้อความแนะนำการแต่งกาย ค่าใช้จ่าย หรือโน้ตส่วนตัว"
              rows={3}
              className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Button type="submit" className="w-full mt-4" loading={loading}>
            ยืนยันเพิ่มกิจกรรม
          </Button>
        </form>
      </div>
    </div>
  )
}
