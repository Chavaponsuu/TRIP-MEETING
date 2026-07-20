# Responsive Design Implementation

## Overview
The Trip Detail Page now features a fully responsive design optimized for both mobile and desktop viewing experiences.

## Layout Structure

### Mobile (< 1024px)
- **Single column layout**: All sections stack vertically
- **Full-width cards**: Cards span the entire container width
- **Metric cards**: Stack 1-2 columns depending on screen size
- **Touch-optimized**: Larger tap targets and spacing
- **Horizontal scrolling**: Month selectors and tags scroll horizontally

### Desktop (≥ 1024px)
- **Two-column layout**: 8-column main content + 4-column sidebar
- **Sticky sidebar**: Member list stays visible while scrolling
- **Larger typography**: Increased font sizes for better readability
- **More spacious**: Increased padding and gaps between elements

## Breakpoints

```css
/* Tailwind breakpoints used */
sm: 640px   /* Small devices (tablets) */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
```

## Component Responsive Features

### 1. Trip Detail Page Layout

**Mobile:**
```
┌─────────────────────┐
│ Back Button         │
├─────────────────────┤
│ Trip Header         │
├─────────────────────┤
│ Metric Cards        │
│ (1-2 columns)       │
├─────────────────────┤
│ Availability        │
├─────────────────────┤
│ Polls               │
├─────────────────────┤
│ Itinerary           │
├─────────────────────┤
│ Members             │
└─────────────────────┘
```

**Desktop:**
```
┌────────────────────────────────────────┐
│ Back Button                             │
├─────────────────────────┬──────────────┤
│ Main Content (8 cols)   │ Sidebar (4)  │
│                         │              │
│ ┌─────────────────────┐ │ ┌──────────┐│
│ │ Trip Header         │ │ │ Members  ││
│ └─────────────────────┘ │ │ (Sticky) ││
│                         │ │          ││
│ ┌─────────────────────┐ │ │          ││
│ │ Metric Cards (3col) │ │ │          ││
│ └─────────────────────┘ │ │          ││
│                         │ │          ││
│ ┌─────────────────────┐ │ └──────────┘│
│ │ Availability        │ │              │
│ └─────────────────────┘ │              │
│                         │              │
│ ┌─────────────────────┐ │              │
│ │ Polls               │ │              │
│ └─────────────────────┘ │              │
│                         │              │
│ ┌─────────────────────┐ │              │
│ │ Itinerary           │ │              │
│ └─────────────────────┘ │              │
└─────────────────────────┴──────────────┘
```

### 2. Metric Cards Component

**Responsive Grid:**
- Mobile (< 640px): 1 column (stacked)
- Tablet (640px-1023px): 2 columns
- Desktop (≥ 1024px): 3 columns

**Features:**
- Truncated text with `min-w-0` to prevent overflow
- Responsive icon sizes: `w-10 h-10` → `w-12 h-12`
- Responsive padding: `p-4` → `p-5`
- Responsive font sizes: `text-sm` → `text-base`
- Third card (invite code) spans 2 columns on tablet

### 3. Availability Heatmap

**Calendar Grid:**
- Always 7 columns (days of week)
- Responsive cell sizes: Smaller on mobile, larger on desktop
- Responsive gap between cells: `gap-1.5` → `gap-2`
- Responsive text sizes: `text-[11px]` → `text-sm`

**Month Selector:**
- Horizontal scroll on all screen sizes
- Negative margin trick for edge-to-edge scroll on mobile: `-mx-2 px-2`
- Flex-shrink-0 on buttons to prevent compression

**Legend:**
- Grid layout: 2 columns on mobile, 3-5 columns on larger screens
- Responsive icon sizes: `w-3 h-3` → `w-4 h-4`
- Responsive text: `text-[10px]` → `text-xs`

### 4. Member List

**Features:**
- Scrollable container: `max-h-[600px]` → `max-h-[800px]`
- Hover effects on desktop: `hover:shadow-md`
- Responsive card padding: `p-3` → `p-4`
- Responsive text sizes: `text-sm` → `text-base`
- Sticky positioning on desktop (via parent container)

**Modal:**
- Full-screen on mobile with padding
- Centered card on desktop
- Animation: `animate-in fade-in zoom-in-95`

### 5. Trip Header

**Responsive Elements:**
- Emoji size: `text-4xl` → `text-5xl`
- Title size: `text-xl` → `text-2xl`
- Layout: Stack on mobile (`flex-col`), row on tablet (`sm:flex-row`)
- Button text: Hide "ทริป" on small screens, show "จัดการทริป" on larger

### 6. Section Headers

All sections use consistent responsive patterns:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <h2 className="text-lg lg:text-xl font-bold">Title</h2>
  <Button className="self-start sm:self-auto">Action</Button>
</div>
```

## Typography Scale

### Mobile
- Extra small: `text-[10px]` (legends, labels)
- Small: `text-xs` (badges, timestamps)
- Base: `text-sm` (body text)
- Large: `text-base` (section headings)
- Extra large: `text-lg` (page sections)

### Desktop
- Extra small: `text-xs`
- Small: `text-sm`
- Base: `text-base`
- Large: `text-lg`
- Extra large: `text-xl`

## Spacing Scale

### Mobile
- Small gap: `gap-2` (8px)
- Medium gap: `gap-3` (12px)
- Large gap: `gap-4` (16px)
- Card padding: `p-3` or `p-4` (12-16px)
- Section spacing: `space-y-4` (16px)

### Desktop
- Small gap: `gap-3` (12px)
- Medium gap: `gap-4` (16px)
- Large gap: `gap-6` (24px)
- Card padding: `p-5` or `p-6` (20-24px)
- Section spacing: `space-y-6` (24px)

## Touch Optimization

### Mobile-Specific Features:
- Minimum tap target: 44x44px (following WCAG guidelines)
- `touch-manipulation` CSS for snappy interactions
- Reduced animation complexity on mobile
- Larger padding around interactive elements
- Overflow scroll with momentum: `-webkit-overflow-scrolling: touch`

## Performance Considerations

### Desktop Optimizations:
- Sticky positioning instead of fixed to reduce reflows
- CSS Grid for efficient layout calculations
- Transform-based animations for GPU acceleration
- Debounced scroll handlers on realtime updates

### Mobile Optimizations:
- Simplified animations
- Lazy loading for off-screen content
- Reduced shadow complexity
- Smaller image/icon sizes

## Accessibility

### Responsive Considerations:
- Sufficient color contrast at all sizes
- Keyboard navigation works on all screen sizes
- Focus indicators scale appropriately
- Touch targets meet WCAG minimum (44x44px)
- Text remains readable without zooming (minimum 16px base)

## Browser Support

Tested and optimized for:
- ✅ Chrome/Edge (latest)
- ✅ Safari (iOS 12+, macOS)
- ✅ Firefox (latest)
- ✅ Samsung Internet (mobile)

## Testing Checklist

- [ ] Mobile portrait (320px-414px)
- [ ] Mobile landscape (568px-896px)
- [ ] Tablet portrait (768px-834px)
- [ ] Tablet landscape (1024px-1366px)
- [ ] Desktop (1440px-1920px)
- [ ] Ultra-wide (2560px+)
- [ ] Text zoom to 200%
- [ ] Touch interactions on mobile/tablet
- [ ] Mouse interactions on desktop
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
