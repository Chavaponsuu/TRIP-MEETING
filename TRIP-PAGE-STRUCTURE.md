# Trip Detail Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ← กลับไปแดชบอร์ด                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 1: TRIP HEADER                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🏖️ ทริปภูเก็ต                    [จัดการทริป] │    │
│  │  กรุงเทพ → ภูเก็ต                                    │    │
│  │  ● กำลังวางแผน  • 5 คนไปแน่นอน                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 2: METRIC CARDS (3-column grid)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐      │
│  │  📅 วันที่ │  │ 💰 งบประมาณ│  │ 👥 รหัสเชิญ        │      │
│  │  รอโหวต   │  │ 5,000 บาท │  │ abc123xy          │      │
│  │  →ไปเลือก │  │ /คน       │  │ [คัดลอก][สร้างใหม่]│      │
│  └───────────┘  └───────────┘  └───────────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 3: MEMBER LIST WITH RSVP                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  สมาชิก (5 คน)                    [เชิญเพื่อน]    │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  [A] อาทิตย์  [เจ้าของทริป] [ไปแน่นอน]            │    │
│  │  [B] บัว      [ผู้จัดการ]    [ไปแน่นอน]    [🗑️]  │    │
│  │  [C] ชาติ                      [อาจจะไป]      [🗑️]  │    │
│  │  [D] ดาว                       [รอตอบกลับ]    [🗑️]  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 4: AVAILABILITY HEATMAP                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  วันที่ว่าง         [เลือกวันที่ตัวเองว่าง/ดูสรุป]│    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  [มกราคม 2025] [กุมภาพันธ์ 2025]  ← month tabs      │    │
│  │                                                       │    │
│  │  Calendar Grid (7x5):                                │    │
│  │  อา  จ   อ   พ   พฤ  ศ   ส                         │    │
│  │  [ ] [ ] [ ] [ ] [ ] [ ] [ ]  ← heat colors         │    │
│  │  [1] [2] [3•][4] [5] [6] [7]  • = you're free      │    │
│  │  ...                                                  │    │
│  │                                                       │    │
│  │  Legend: ⬜ 0%  🟦 25%  🟩 50%  🟨 75%  🟥 100%     │    │
│  │  [ยืนยัน 3 วันที่เลือก] ← organizer only           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 5: POLLS                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  โพลล์และความคิดเห็น              [+ สร้างโพลล์]  │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  📊 ที่พักเลือกไหนดี?  (single choice)             │    │
│  │  ⏰ ปิดโหวต: 2 วันข้างหน้า                         │    │
│  │  ○ โรงแรม A  ▓▓▓▓▓▓░░░░ 60% (3 คน)               │    │
│  │  ● โรงแรม B  ▓▓▓░░░░░░░ 40% (2 คน) ✓ voted      │    │
│  │  ○ โรงแรม C  ░░░░░░░░░░  0% (0 คน)               │    │
│  │                                                       │    │
│  │  📊 กิจกรรมที่อยากทำ?  (multi choice)              │    │
│  │  ☑ ดำน้ำ     ▓▓▓▓▓▓▓░░░ 70% (3/5)  ✓ voted       │    │
│  │  ☐ เดินป่า   ▓▓▓▓░░░░░░ 40% (2/5)                 │    │
│  │  ☑ นวดสปา   ▓▓▓▓▓▓░░░░ 60% (3/5)  ✓ voted       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SECTION 6: ITINERARY                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  กำหนดการ                         [+ เพิ่มกิจกรรม] │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  📍 วันที่ 1 (15 มี.ค. 2025)                        │    │
│  │    ┌────────────────────────────────────────────┐   │    │
│  │    │ 09:00-11:00 🚗 เดินทางถึงภูเก็ต             │   │    │
│  │    │ 📍 สนามบินภูเก็ต                             │   │    │
│  │    │ เสนอโดย: อาทิตย์  [ยังไม่ยืนยัน] [❤️3]    │   │    │
│  │    └────────────────────────────────────────────┘   │    │
│  │    ┌────────────────────────────────────────────┐   │    │
│  │    │ 14:00-17:00 🏖️ เล่นน้ำหาดป่าตอง           │   │    │
│  │    │ 📍 หาดป่าตอง                                │   │    │
│  │    │ เสนอโดย: บัว  [ยืนยันแล้ว] [❤️5] [💬2]   │   │    │
│  │    └────────────────────────────────────────────┘   │    │
│  │                                                       │    │
│  │  📍 วันที่ 2 (16 มี.ค. 2025)                        │    │
│  │    [similar cards...]                                │    │
│  │                                                       │    │
│  │  📍 ยังไม่กำหนดวัน                                  │    │
│  │    [unscheduled items...]                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Interaction Flows

### 1. Organizer Confirms Dates
```
User clicks "ยืนยันวันที่" in heatmap
  → Enters selection mode
  → Clicks multiple days
  → Clicks "ยืนยัน X วันที่เลือก"
  → Confirmation dialog
  → Updates trip: start_date, end_date, date_mode='fixed', status→'planning'
  → Metric Card updates to show fixed dates
  → All members see realtime update
```

### 2. Member Joins via Invite Link
```
User visits /invite/abc123xy
  → Sees trip preview
  → Clicks "เข้าร่วมทริป"
  → Inserts into trip_members with rsvp_status='pending'
  → All existing members see new member appear (realtime)
  → New member sees full trip detail page
```

### 3. Real-time Availability Update
```
User A selects availability dates
  → Saves to database
  → Supabase broadcasts change
  → User B's heatmap updates (after 500ms debounce)
  → Colors shift to reflect new availability percentage
  → Hover tooltip shows User A in the list
```

### 4. Poll Vote Flow
```
User views poll card
  → Single-choice: clicks radio button
  → Multi-choice: toggles checkboxes
  → Ranked: drag-and-drop to reorder
  → Vote is submitted
  → Progress bars update instantly (realtime)
  → Other members see live vote count updates
```

## Permission Matrix

| Action | Owner | Co-organizer | Member |
|--------|-------|--------------|--------|
| View trip | ✅ | ✅ | ✅ |
| Edit trip settings | ✅ | ✅ | ❌ |
| Regenerate invite code | ✅ | ✅ | ❌ |
| Kick members | ✅ | ✅ | ❌ (except owner) |
| Confirm dates | ✅ | ✅ | ❌ |
| Create polls | ✅ | ✅ | ❌ |
| Vote on polls | ✅ | ✅ | ✅ |
| Select availability | ✅ | ✅ | ✅ |
| Add itinerary item | ✅ | ✅ | ✅ |
| Confirm itinerary | ✅ | ✅ | ❌ |
| Edit own itinerary | ✅ | ✅ | ✅ |
| Delete own itinerary | ✅ | ✅ | ✅ |
| Delete others' itinerary | ✅ | ✅ | ❌ |

## Mobile Layout

On mobile (< 640px):
- Metric cards stack vertically (1 column)
- Member list remains single column
- Calendar grid maintains 7 columns (compressed)
- Month selector becomes horizontally scrollable
- All sections stack vertically
- Sticky headers for day labels in itinerary
