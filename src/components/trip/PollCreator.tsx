'use client'

import { useState } from 'react'
import { usePolls } from '@/hooks/usePolls'
import { Button } from '@/components/ui/Button'
import { PollType } from '@/types'

interface PollCreatorProps {
  tripId: string
  onCreated: () => void
  onCancel: () => void
}

export function PollCreator({ tripId, onCreated, onCancel }: PollCreatorProps) {
  const { createPoll } = usePolls(tripId)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pollType, setPollType] = useState<PollType>('single_choice')
  const [options, setOptions] = useState<string[]>(['', ''])
  
  const [deadline, setDeadline] = useState('')
  const [allowVoteChanges, setAllowVoteChanges] = useState(true)
  const [resultsVisibility, setResultsVisibility] = useState<'live' | 'after_close'>('live')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    const updated = options.filter((_, idx) => idx !== index)
    setOptions(updated)
  }

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options]
    updated[index] = val
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const filteredOptions = options.map(o => o.trim()).filter(o => o !== '')
    if (filteredOptions.length < 2) {
      setError('กรุณากรอกตัวเลือกอย่างน้อย 2 ตัวเลือก')
      return
    }

    setLoading(true)

    const { error: err } = await createPoll({
      title,
      description: description.trim() === '' ? undefined : description,
      poll_type: pollType,
      options: filteredOptions,
      deadline: deadline === '' ? null : new Date(deadline).toISOString(),
      allow_vote_changes: allowVoteChanges,
      results_visibility: resultsVisibility
    })

    setLoading(false)

    if (err) {
      setError(err)
    } else {
      onCreated()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border p-4 rounded-xl shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <h3 className="font-bold text-base text-foreground">สร้างโพลล์ใหม่</h3>
        <button type="button" onClick={onCancel} className="text-text-secondary hover:text-foreground text-sm font-semibold">
          ยกเลิก
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-text-secondary">หัวข้อโพลล์</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น โหวตประเภทอาหารมื้อเย็นวันแรก"
          className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-text-secondary">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ระบุคำอธิบายหรือที่มาของโพลล์นี้"
          rows={2}
          className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Poll Type */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-text-secondary">ประเภทการโหวต</label>
        <select
          value={pollType}
          onChange={(e) => setPollType(e.target.value as PollType)}
          className="w-full border border-border rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
        >
          <option value="single_choice">โหวตได้คำตอบเดียว (Single Choice)</option>
          <option value="multi_choice">โหวตได้หลายคำตอบ (Multiple Choice)</option>
          <option value="ranked">จัดอันดับคะแนน (Ranked Choice)</option>
        </select>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-secondary">ตัวเลือกโพลล์</label>
        <div className="space-y-2">
          {options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs font-semibold text-text-secondary min-w-[20px]">{idx + 1}.</span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`ตัวเลือกที่ ${idx + 1}`}
                className="flex-1 border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddOption}
          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-1"
        >
          เพิ่มตัวเลือก
        </button>
      </div>

      {/* Deadline (optional) */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-text-secondary">กำหนดสิ้นสุดเวลาโหวต (ไม่บังคับ)</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={allowVoteChanges}
            onChange={(e) => setAllowVoteChanges(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4"
          />
          <span className="text-xs font-semibold text-foreground">อนุญาตให้ผู้โหวตเปลี่ยนคำตอบได้ภายหลัง</span>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary">การแสดงผลลัพธ์</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="radio"
                name="results_visibility"
                checked={resultsVisibility === 'live'}
                onChange={() => setResultsVisibility('live')}
                className="text-primary focus:ring-primary/20 w-4 h-4"
              />
              แสดงผลโหวตทันที
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="radio"
                name="results_visibility"
                checked={resultsVisibility === 'after_close'}
                onChange={() => setResultsVisibility('after_close')}
                className="text-primary focus:ring-primary/20 w-4 h-4"
              />
              ซ่อนผลลัพธ์จนกว่าโพลล์จะปิด
            </label>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        สร้างโพลล์
      </Button>
    </form>
  )
}
