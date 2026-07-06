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
  
  // Generate next 12 months for multi-selection
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  const monthsOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth + i, 1);
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTH_NAMES_TH[d.getMonth()]} ${d.getFullYear()}`
    };
  });

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
        <h1 className="text-xl font-bold text-foreground">สร้างทริปใหม่</h1>
        <p className="text-sm text-text-secondary mt-0.5">
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
              className="text-sm font-medium text-foreground"
            >
              รายละเอียด (ไม่บังคับ)
            </label>
            <textarea
              id="description"
              placeholder="เล่าให้เพื่อนฟัง..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              ช่วงเดือนที่ต้องการวางแผนทริป (เลือกได้มากกว่า 1 เดือน)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-lg bg-gray-50/50">
              {monthsOptions.map((opt) => {
                const isSelected = selectedMonths.some(
                  (m) => m.month === opt.month && m.year === opt.year
                );
                return (
                  <button
                    key={`${opt.year}-${opt.month}`}
                    type="button"
                    onClick={() => toggleMonth(opt)}
                    className={`flex items-center justify-center py-2 px-3 text-xs font-medium rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                        : "bg-white border-border text-text-secondary hover:border-gray-400 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
