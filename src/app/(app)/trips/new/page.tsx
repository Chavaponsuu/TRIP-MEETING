"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MONTH_NAMES_TH } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EmojiPicker } from "@/components/trip/EmojiPicker";

export default function NewTripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const now = new Date();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [emoji, setEmoji] = useState("🗺️");
  const [description, setDescription] = useState("");
  
  const currentYear = now.getFullYear();
  // Year the user is currently browsing in the picker
  const [pickerYear, setPickerYear] = useState(currentYear);

  const [selectedMonths, setSelectedMonths] = useState<{ month: number; year: number }[]>([
    { month: now.getMonth() + 1, year: now.getFullYear() }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleMonth = (m: { month: number; year: number }) => {
    setSelectedMonths(prev => {
      const exists = prev.some(item => item.month === m.month && item.year === m.year);
      if (exists) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(item => !(item.month === m.month && item.year === m.year));
      } else {
        return [...prev, m].sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedMonths.length === 0) {
      setError("กรุณาเลือกอย่างน้อย 1 เดือน");
      return;
    }

    setLoading(true);
    setError("");

    const firstMonth = selectedMonths[0];

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name,
        destination,
        emoji,
        description: description || null,
        month: firstMonth.month,
        year: firstMonth.year,
        months: selectedMonths,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError || !trip) {
      setError("ไม่สามารถสร้างทริปได้ กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("trip_members")
      .insert({ trip_id: trip.id, user_id: user.id });

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

          <Input
            id="name"
            label="ชื่อทริป"
            placeholder="เช่น ทริปเกาะสมุย"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="destination"
            label="จุดหมาย"
            placeholder="เช่น เกาะสมุย, ประเทศไทย"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-foreground block mb-1.5"
            >
              รายละเอียด (ไม่บังคับ)
            </label>
            <textarea
              id="description"
              placeholder="เล่าให้เพื่อนฟัง..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base rounded-lg border-2 border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none touch-manipulation"
            />
          </div>

          {/* ── Month picker (flight-booking style) ── */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              ช่วงเดือนที่ต้องการวางแผนทริป
              <span className="ml-1 text-xs text-text-secondary font-normal">
                (เลือกได้มากกว่า 1 เดือน)
              </span>
            </label>

            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              {/* Year navigator */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-indigo-500">
                <button
                  type="button"
                  onClick={() => setPickerYear(y => y - 1)}
                  disabled={pickerYear <= currentYear}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ‹
                </button>
                <span className="text-white font-bold text-base tracking-wide">
                  {pickerYear}
                </span>
                <button
                  type="button"
                  onClick={() => setPickerYear(y => y + 1)}
                  disabled={pickerYear >= currentYear + 2}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ›
                </button>
              </div>

              {/* Month grid — 3 cols on mobile, 4 cols on tablet+ */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-border p-px">
                {MONTH_NAMES_TH.map((name, idx) => {
                  const m = idx + 1;
                  const isPast =
                    pickerYear === currentYear && m < now.getMonth() + 1;
                  const isSelected = selectedMonths.some(
                    s => s.month === m && s.year === pickerYear
                  );
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={isPast}
                      onClick={() => toggleMonth({ month: m, year: pickerYear })}
                      className={`relative flex flex-col items-center justify-center py-4 text-sm font-semibold transition-all duration-150 touch-manipulation
                        ${
                          isSelected
                            ? 'bg-primary text-white font-bold shadow-inner'
                            : isPast
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            : 'bg-white text-foreground hover:bg-indigo-50 hover:text-primary active:bg-indigo-100'
                        }`}
                    >
                      {name}
                      {isSelected && (
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/90" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected summary chips */}
            {selectedMonths.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedMonths.map(s => (
                  <span
                    key={`${s.year}-${s.month}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    {MONTH_NAMES_TH[s.month - 1]} {s.year}
                    <button
                      type="button"
                      onClick={() => toggleMonth(s)}
                      className="text-primary/60 hover:text-primary leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
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
