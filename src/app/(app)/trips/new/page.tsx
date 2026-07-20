"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MONTH_NAMES_TH } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmojiPicker } from "@/components/trip/EmojiPicker";
import { TripStatus } from "@/types";

export default function NewTripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const now = new Date();
  const [name, setName] = useState("");
  // Support multiple destinations (string array)
  const [destinations, setDestinations] = useState<string[]>([""]);
  const [emoji, setEmoji] = useState("🗺️");
  const [description, setDescription] = useState("");
  
  // Budget & Status & Cover Image
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [status, setStatus] = useState<TripStatus>("planning");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const currentYear = now.getFullYear();
  const [pickerYear, setPickerYear] = useState(currentYear);

  const [selectedMonths, setSelectedMonths] = useState<{ month: number; year: number }[]>([
    { month: now.getMonth() + 1, year: now.getFullYear() }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddDestination = () => {
    setDestinations([...destinations, ""]);
  };

  const handleRemoveDestination = (idx: number) => {
    if (destinations.length <= 1) return;
    setDestinations(destinations.filter((_, i) => i !== idx));
  };

  const handleDestinationChange = (idx: number, val: string) => {
    const updated = [...destinations];
    updated[idx] = val;
    setDestinations(updated);
  };

  const toggleMonth = (m: { month: number; year: number }) => {
    setSelectedMonths(prev => {
      const exists = prev.some(item => item.month === m.month && item.year === m.year);
      if (exists) {
        if (prev.length <= 1) return prev;
        return prev.filter(item => !(item.month === m.month && item.year === m.year));
      } else {
        return [...prev, m].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Filter out blank destinations
    const filteredDestinations = destinations.map(d => d.trim()).filter(d => d !== "");
    if (filteredDestinations.length === 0) {
      setError("กรุณากรอกจุดหมายปลายทางอย่างน้อย 1 แห่ง");
      return;
    }

    if (selectedMonths.length === 0) {
      setError("กรุณาเลือกอย่างน้อย 1 เดือน");
      return;
    }

    setLoading(true);
    setError("");

    const firstMonth = selectedMonths[0];
    const parsedBudget = budget.trim() === "" ? null : parseFloat(budget);

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name: name.trim(),
        destination: filteredDestinations, // Array type
        emoji,
        description: description.trim() || null,
        month: firstMonth.month,
        year: firstMonth.year,
        months: selectedMonths,
        status,
        date_mode: "flexible", // starts as flexible date planning
        budget: parsedBudget,
        currency,
        cover_image_url: coverImageUrl.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError || !trip) {
      setError("ไม่สามารถสร้างทริปได้ กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    // Auto join as owner
    const { error: memberError } = await supabase
      .from("trip_members")
      .insert({ 
        trip_id: trip.id, 
        user_id: user.id,
        role: "owner",
        rsvp_status: "going"
      });

    if (memberError) {
      setError("ไม่สามารถเข้าร่วมทริปได้");
      setLoading(false);
      return;
    }

    router.push(`/trips/${trip.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">สร้างทริปใหม่</h1>
        <p className="text-sm text-text-secondary mt-1">
          กรอกรายละเอียดทริปของคุณ
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <EmojiPicker value={emoji} onChange={setEmoji} />

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">ชื่อทริป</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ทริปเกาะสมุย"
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          {/* Multiple Destinations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">จุดหมายปลายทาง</label>
            <div className="space-y-2">
              {destinations.map((dest, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={dest}
                    onChange={(e) => handleDestinationChange(idx, e.target.value)}
                    placeholder={`จุดหมายที่ ${idx + 1}`}
                    className="flex-1 px-4 py-2.5 text-base rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                  {destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDestination(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-border"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddDestination}
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-1"
            >
              ＋ เพิ่มจุดหมาย
            </button>
          </div>

          {/* Budget and Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground block">งบประมาณทริป (ไม่บังคับ)</label>
              <input
                type="number"
                placeholder="เช่น 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">สกุลเงิน</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-lg border-2 border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
              >
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Status Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">สถานะเริ่มต้น</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TripStatus)}
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
            >
              <option value="draft">ร่างแผนทริป (Draft)</option>
              <option value="planning">กำลังวางแผน (Planning)</option>
              <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
              <option value="ongoing">กำลังเดินทาง (Ongoing)</option>
              <option value="completed">เสร็จสิ้นแล้ว (Completed)</option>
              <option value="cancelled">ยกเลิกแล้ว (Cancelled)</option>
            </select>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">รูปหน้าปก (ไม่บังคับ)</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">รายละเอียดทริป (ไม่บังคับ)</label>
            <textarea
              placeholder="บอกรายละเอียดหรือสิ่งที่เตรียมตัวก่อนไปทริป..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Month picker */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-3">
              ช่วงเดือนที่ต้องการวางแผนทริป
              <span className="ml-2 text-xs text-text-secondary font-normal">
                (เลือกได้หลายเดือน)
              </span>
            </label>

            {/* Year Selector - Modern Tabs Style */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPickerYear(y => y - 1)}
                disabled={pickerYear <= currentYear}
                className="p-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-500 rounded-full shadow-lg shadow-primary/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white font-bold text-lg tracking-wide">
                    {pickerYear}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPickerYear(y => y + 1)}
                disabled={pickerYear >= currentYear + 2}
                className="p-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Month Grid - Modern Card Style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {MONTH_NAMES_TH.map((name, idx) => {
                const m = idx + 1;
                const isPast = pickerYear === currentYear && m < now.getMonth() + 1;
                const isSelected = selectedMonths.some(s => s.month === m && s.year === pickerYear);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isPast}
                    onClick={() => toggleMonth({ month: m, year: pickerYear })}
                    className={`group relative overflow-hidden rounded-xl p-4 text-center font-semibold transition-all duration-200 touch-manipulation
                      ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary to-indigo-500 text-white shadow-lg shadow-primary/30 scale-105 border-2 border-primary'
                          : isPast
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-200'
                          : 'bg-white text-foreground border-2 border-border hover:border-primary hover:shadow-md hover:scale-102 active:scale-98'
                      }`}
                  >
                    {/* Background decoration */}
                    {!isPast && !isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    
                    {/* Month name */}
                    <div className="relative z-10">
                      <div className={`text-base ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                        {name}
                      </div>
                      
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover indicator for unselected */}
                      {!isSelected && !isPast && (
                        <div className="mt-2 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>

                    {/* Shine effect on hover */}
                    {!isPast && !isSelected && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected months display - Modern chips */}
            {selectedMonths.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    เดือนที่เลือก ({selectedMonths.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMonths.map(s => (
                    <span
                      key={`${s.year}-${s.month}`}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border-2 border-primary/30 text-primary hover:border-primary hover:shadow-md transition-all"
                    >
                      <span className="text-sm font-semibold">
                        {MONTH_NAMES_TH[s.month - 1]} {s.year}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMonth(s)}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white text-primary/60 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
            >
              ยกเลิก
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              สร้างทริป
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
