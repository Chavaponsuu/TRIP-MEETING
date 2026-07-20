# Layout Comparison: Mobile vs Desktop

## Key Differences

### Mobile Layout (< 1024px)
- **Single column** vertical scrolling
- Members section at the bottom
- Full-width cards
- Horizontal scroll for month selectors
- Compact spacing

### Desktop Layout (≥ 1024px)
- **Two-column** layout (66.67% / 33.33%)
- Members section in **sticky sidebar**
- Wider cards with more breathing room
- Expanded spacing and typography
- Better use of horizontal space

---

## Desktop Advantages

### 1. Sticky Sidebar
The member list stays visible while you scroll through polls, availability, and itinerary:
```
┌────────────────┬─────────┐
│ Content        │ Members │ ← Always visible
│ (scrollable)   │ (sticky)│
│                │         │
│ [Polls]        │ [List]  │
│ [Itinerary]    │         │
│ [More...]      │         │
└────────────────┴─────────┘
```

### 2. Horizontal Space Utilization
```
Mobile (cramped):
┌─────────────┐
│ [Date Card] │
├─────────────┤
│[Budget Card]│
├─────────────┤
│[Invite Card]│
└─────────────┘

Desktop (spacious):
┌───────┬───────┬───────┐
│ Date  │Budget │Invite │
└───────┴───────┴───────┘
```

### 3. Better Calendar Visibility
```
Mobile:
- Smaller cells (tight grid)
- Smaller text
- Less hover/focus states

Desktop:
- Larger cells (comfortable grid)
- Bigger text
- Rich hover tooltips
- Better click targets
```

### 4. Multi-tasking View
On desktop, you can see:
- Current poll results
- Available dates
- Member list
- All at the same time without scrolling

---

## Mobile Advantages

### 1. Focus
Only one section in view at a time = less distraction

### 2. Touch Optimization
- Larger buttons relative to screen
- Natural swipe gestures for month selector
- Full-width tap targets

### 3. Reading Flow
Natural top-to-bottom reading pattern

---

## Layout Switching

The layout automatically adapts at **1024px** (Tailwind's `lg` breakpoint):

```css
/* Automatic grid transformation */
grid-cols-1      /* Mobile: 1 column */
lg:grid-cols-12  /* Desktop: 12-column grid */

/* Content spans */
lg:col-span-8    /* Main content: 8/12 (66.67%) */
lg:col-span-4    /* Sidebar: 4/12 (33.33%) */

/* Spacing increases */
gap-4            /* Mobile: 16px */
lg:gap-6         /* Desktop: 24px */

/* Typography scales */
text-lg          /* Mobile: 18px */
lg:text-xl       /* Desktop: 20px */
```

---

## Component Behavior Changes

### Metric Cards
| Mobile | Desktop |
|--------|---------|
| 1-2 columns | 3 columns |
| Icons: 40px | Icons: 48px |
| Padding: 16px | Padding: 20px |

### Calendar Grid
| Mobile | Desktop |
|--------|---------|
| Cells: ~40px | Cells: ~60px |
| Text: 11px | Text: 14px |
| Gap: 6px | Gap: 8px |

### Member Cards
| Mobile | Desktop |
|--------|---------|
| Full width | Fixed in sidebar |
| Static position | Sticky scroll |
| Text: 14px | Text: 16px |

### Section Headers
| Mobile | Desktop |
|--------|---------|
| Stack vertically | Row layout |
| Button: full-width | Button: auto-width |
| Font: 18px | Font: 20px |

---

## Sticky Sidebar Behavior

```javascript
// Desktop only (lg:)
className="lg:sticky lg:top-4"

// Stays in view while parent scrolls
// Offset 16px from top
// Only on screens ≥ 1024px
```

This means:
- ✅ Desktop: Member list floats while you scroll
- ✅ Mobile: Member list stays in natural flow
- ✅ Tablet: Depends on screen size (1024px threshold)

---

## Real-World Examples

### Scenario 1: Reviewing Poll Results
**Mobile:** 
1. Scroll to polls section
2. Read poll
3. Scroll to members to see who voted
4. Scroll back to poll

**Desktop:**
1. View poll in main area
2. See who voted in sidebar (no scroll needed)
3. Simultaneous view = faster decision

### Scenario 2: Selecting Availability
**Mobile:**
1. Tap calendar days
2. Save
3. Scroll to members to see who else is free

**Desktop:**
1. Click calendar days
2. See member list updating in sidebar (realtime)
3. No context switching needed

### Scenario 3: Adding Itinerary
**Mobile:**
1. Scroll through existing items
2. Add new item
3. Scroll to members to verify who suggested what

**Desktop:**
1. Browse itinerary in main area
2. Add new item
3. Member list visible in sidebar = context maintained

---

## Performance Notes

### Mobile
- Simpler layout = faster render
- Less DOM manipulation (no sticky calculations)
- Optimized for touch events

### Desktop
- CSS Grid leverages GPU
- Sticky positioning uses compositing layer
- Larger viewport = more preloaded content

---

## Best Practices for Each Layout

### Mobile Development
```tsx
// Stack vertically
className="flex flex-col gap-4"

// Full-width components
className="w-full"

// Touch-friendly sizes
className="min-h-[44px] px-4"

// Horizontal overflow for wide content
className="overflow-x-auto -mx-4 px-4"
```

### Desktop Development
```tsx
// Use grid for complex layouts
className="grid grid-cols-12 gap-6"

// Sticky components
className="lg:sticky lg:top-4"

// Hover states (ignored on touch)
className="hover:shadow-lg transition-shadow"

// Larger interactive elements
className="lg:p-6 lg:text-lg"
```

---

## Testing Both Layouts

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test responsive breakpoints:
   - iPhone SE (375px) - Mobile
   - iPad (768px) - Tablet
   - Desktop (1440px) - Desktop

### Key Breakpoints to Test
- 375px (iPhone SE)
- 768px (iPad portrait)
- 1024px (Layout switch point)
- 1440px (Standard desktop)
- 1920px (Full HD)

### Visual Regression Checks
- [ ] Metric cards align properly at all sizes
- [ ] Calendar grid doesn't overflow
- [ ] Member list doesn't get cut off
- [ ] Buttons don't wrap awkwardly
- [ ] Text remains readable
- [ ] No horizontal scroll on any breakpoint
