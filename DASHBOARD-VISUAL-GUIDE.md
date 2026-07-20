# Dashboard Visual Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  [🧑]  สวัสดี 👋 ชื่อเล่น           [ใส่รหัสเชิญ] [สร้างทริป] │
│       พร้อมวางแพลนทริปกับเพื่อนๆ แล้วหรือยัง?                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ [🏖️] ทริปภูเก็ต → กระบี่                                │
│     📍 ภูเก็ต → กระบี่                                        │
│     รอการตอบรับจากคุณ                      [ดูรายละเอียด]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [กำลังจะไป (3)]  [ต้องตอบรับ (1)]  [ผ่านไปแล้ว (2)]       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│  ┌────────────────────┐  │  ┌────────────────────┐  │
│  │   [Cover Image]    │  │  │   [Gradient]       │  │
│  │                    │  │  │                    │  │
│  │  [กำลังวางแพลน]    │  │  │  [ยืนยันแล้ว]      │  │
│  └────────────────────┘  │  └────────────────────┘  │
│  🏖️ ทริปภูเก็ต           │  🏔️ เชียงใหม่            │
│  📍 ภูเก็ต               │  📍 เชียงใหม่ → ปาย       │
│  [👤][👤][👤]  14-16 ธ.ค. │  [👤][👤]  รอโหวตวันที่  │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

## Component Breakdown

### 1. Header Section
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Avatar]  สวัสดี 👋 ชื่อ              [Btn] [Btn]   │
│            พร้อมวางแพลนทริปกับเพื่อนๆ แล้วหรือยัง?    │
│                                                      │
└──────────────────────────────────────────────────────┘

Components:
- UserAvatar (48px, DiceBear Lorelei)
- Greeting text (extracted nickname from full name)
- Button "ใส่รหัสเชิญ" (secondary, opens modal)
- Button "สร้างทริป" (primary, navigates)
```

### 2. Pending Banner (Conditional)
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [⏰]  🏖️ ทริปภูเก็ต                  [ดูรายละเอียด] │
│        📍 ภูเก็ต → กระบี่                             │
│        รอการตอบรับจากคุณ และอีก 2 ทริป                │
│                                                      │
└──────────────────────────────────────────────────────┘

Colors:
- Background: bg-yellow-50
- Border: border-yellow-200 (2px)
- Icon: bg-yellow-100, text-yellow-600
- Message: text-yellow-800
```

### 3. Filter Tabs
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [กำลังจะไป (3)]  [ต้องตอบรับ (1)]  [ผ่านไปแล้ว (0)] │
│  ─────────────                                       │
│  (active underline)                                  │
│                                                      │
└──────────────────────────────────────────────────────┘

States:
- Active: border-primary (2px bottom), text-primary
- Inactive: border-transparent, text-text-secondary
- Hover: border-gray-300, text-foreground
- Badge: rounded-full, shows count
  - Active: bg-primary, text-white
  - Inactive: bg-gray-200, text-text-secondary
```

### 4. Trip Card
```
┌────────────────────────────────────┐
│                                    │
│    [Cover Image or Gradient]       │
│          h-32                      │
│    [กำลังวางแพลน]  ← status badge  │
│                                    │
├────────────────────────────────────┤
│  🏖️ ทริปภูเก็ต                     │
│  📍 ภูเก็ต → กระบี่                 │
│                                    │
│  [👤][👤][👤]+2    14-16 ธ.ค.      │
│  (Avatar stack)   (Date text)      │
│                                    │
└────────────────────────────────────┘

Dimensions:
- Card: rounded-xl, border, shadow-sm
- Cover: h-32 (128px)
- Padding: p-4 (16px)
- Avatar size: 32px each
- Avatar overlap: -8px (25%)
```

### 5. Empty States

**No trips at all:**
```
┌────────────────────────────────────┐
│                                    │
│             🗺️                     │
│         (text-7xl)                 │
│                                    │
│        ยังไม่มีทริป                 │
│                                    │
│   สร้างทริปแล้วชวนเพื่อนมาเลือก    │
│         วันว่างกัน                 │
│                                    │
│    [สร้างทริปแรกของคุณ]            │
│                                    │
└────────────────────────────────────┘
```

**Tab empty:**
```
┌────────────────────────────────────┐
│                                    │
│    ยังไม่มีทริปที่ต้องตอบรับตอนนี้  │
│                                    │
└────────────────────────────────────┘
```

### 6. Join by Code Modal
```
        ┌──────────────────────────┐
        │  ใส่รหัสเชิญ          [✕] │
        ├──────────────────────────┤
        │                          │
        │  กรอกรหัสเชิญ 8 ตัว...   │
        │                          │
        │  ┌────────────────────┐  │
        │  │    A B C 1 2 3 4 5  │  │
        │  └────────────────────┘  │
        │  (centered, mono font)   │
        │                          │
        │  [ยกเลิก]  [เข้าร่วม]    │
        │                          │
        └──────────────────────────┘

Features:
- Backdrop: bg-black/50, backdrop-blur-sm
- Modal: max-w-md, rounded-2xl
- Input: text-center, uppercase, maxLength 8
- Error: red text with icon below input
```

## Responsive Breakpoints

### Mobile (< 768px)
```
┌──────────────────────────┐
│  [🧑] สวัสดี 👋 ชื่อ      │
│                          │
│  [รหัสเชิญ] [ทริปใหม่]    │
└──────────────────────────┘

┌──────────────────────────┐
│  ⚠️ Pending Banner        │
└──────────────────────────┘

┌──────────────────────────┐
│  [Tab] [Tab] [Tab]       │
│  (horizontal scroll)     │
└──────────────────────────┘

┌──────────────────────────┐
│  Trip Card 1             │
└──────────────────────────┘
┌──────────────────────────┐
│  Trip Card 2             │
└──────────────────────────┘
(1 column grid)
```

### Desktop (≥ 768px)
```
┌────────────────────────────────────────────┐
│  [🧑] สวัสดี 👋 ชื่อ    [ใส่รหัสเชิญ] [สร้างทริป] │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  ⚠️ Pending Banner                         │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  [Tab] [Tab] [Tab]                         │
└────────────────────────────────────────────┘

┌───────────────────┬───────────────────┐
│  Trip Card 1      │  Trip Card 2      │
└───────────────────┴───────────────────┘
┌───────────────────┬───────────────────┐
│  Trip Card 3      │  Trip Card 4      │
└───────────────────┴───────────────────┘
(2 column grid)
```

## Color Palette

### Status Badges
| Status | Thai | Background | Text |
|--------|------|------------|------|
| draft | ร่าง | bg-yellow-100 | text-yellow-800 |
| planning | กำลังวางแพลน | bg-indigo-100 | text-indigo-800 |
| confirmed | ยืนยันแล้ว | bg-green-100 | text-green-800 |
| ongoing | กำลังเดินทาง | bg-blue-100 | text-blue-800 |
| completed | เสร็จสิ้น | bg-gray-100 | text-gray-800 |
| cancelled | ยกเลิก | bg-red-100 | text-red-800 |

### Gradients (Cover Fallback)
1. `from-blue-400 to-purple-500`
2. `from-pink-400 to-orange-500`
3. `from-green-400 to-cyan-500`
4. `from-yellow-400 to-red-500`
5. `from-indigo-400 to-pink-500`
6. `from-cyan-400 to-blue-500`

*Consistent per trip ID using hash function*

## Animations

### Card Hover
```css
transition-all duration-150
hover:shadow-md
hover:border-primary/30
active:scale-[0.98]
```

### Tab Switch
```css
transition-all duration-150
(border-bottom animates color/width)
```

### Modal
```css
animate-in fade-in zoom-in duration-200
(backdrop + modal fade + scale in)
```

### Loading Skeleton
```css
animate-pulse
(all skeleton elements pulse together)
```

## Spacing Scale

```
Component Spacing:
- Page padding: space-y-6 (24px vertical gap)
- Header internal: gap-3 (12px)
- Card padding: p-4 (16px)
- Card grid gap: gap-4 (16px)
- Avatar stack gap: -8px overlap
- Status badge: px-2 py-1 (8px/4px)
- Tab padding: px-4 py-3 (16px/12px)
```

## Typography

```
Header Greeting:
- Size: text-xl (20px)
- Weight: font-bold (700)
- Color: text-foreground

Card Title:
- Size: text-base (16px)
- Weight: font-bold (700)
- Color: text-foreground

Card Destination:
- Size: text-sm (14px)
- Weight: font-normal (400)
- Color: text-text-secondary

Status Badge:
- Size: text-xs (12px)
- Weight: font-bold (700)
- Color: varies by status

Date Text:
- Size: text-xs (12px)
- Weight: font-semibold (600)
- Color: text-text-secondary
```

## Interaction States

### Button States
```
Default:    bg-primary, text-white
Hover:      bg-primary-hover
Active:     scale-95 (touch feedback)
Disabled:   opacity-50, cursor-not-allowed
Loading:    spinner animation, text "กำลังโหลด..."
```

### Card States
```
Default:    border-border, shadow-sm
Hover:      border-primary/30, shadow-md
Active:     scale-[0.98] (touch feedback)
```

### Tab States
```
Default:    text-text-secondary, border-transparent
Hover:      text-foreground, border-gray-300
Active:     text-primary, border-primary (2px)
```

## Accessibility

- Semantic HTML (header, nav, main, article)
- ARIA labels on icon buttons
- Focus indicators (ring-2 ring-primary)
- Keyboard navigation (tab order)
- Alt text on images
- Color contrast meets WCAG AA
- Touch targets ≥ 44px (mobile)
