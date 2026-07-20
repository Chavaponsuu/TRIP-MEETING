# Dashboard Migration Guide

## 🔄 Migration from Old Dashboard

This guide helps you understand the changes from the old dashboard to the new one.

---

## 📊 What Changed?

### Old Dashboard
```tsx
// Simple server component
- Fetched all trips directly in page component
- Basic "Active" and "History" sections
- Simple TripCard component
- No filtering beyond active/history
- No real-time updates
```

### New Dashboard
```tsx
// Modern architecture
- Server component fetches user data only
- Client component handles state and filtering
- 3-way filtering (going/pending/completed)
- Real-time subscriptions
- Modern UI with cover images
- Avatar stacks
- Join by invite code modal
```

---

## 🗂️ File Changes

### Removed/Replaced
❌ **TripList component** - Replaced with `TripCardGrid`  
❌ **Old TripCard** - Replaced with `DashboardTripCard`  
❌ Direct trip fetching in page.tsx

### Added
✅ `DashboardClient.tsx` - Main client component  
✅ `DashboardHeader.tsx` - Header with actions  
✅ `JoinByCodeModal.tsx` - Join by code functionality  
✅ `TripFilterTabs.tsx` - 3-tab filtering  
✅ `DashboardTripCard.tsx` - Modern trip card  
✅ `TripCardGrid.tsx` - Grid layout  
✅ `AvatarStack.tsx` - Overlapping avatars  
✅ `PendingInviteBanner.tsx` - Pending invites banner  
✅ `EmptyState.tsx` - Empty states  
✅ `DashboardSkeleton.tsx` - Loading skeleton  
✅ `useMyTrips.ts` - Custom hook

---

## 🔀 Component Mapping

### Old → New

| Old Component | New Component | Changes |
|--------------|---------------|---------|
| `TripList` | `TripCardGrid` | Grid layout, no sections |
| `TripCard` | `DashboardTripCard` | Cover image, avatar stack, status badge |
| Page fetching | `useMyTrips` hook | Client-side with real-time |
| N/A | `TripFilterTabs` | New filtering system |
| N/A | `PendingInviteBanner` | New feature |
| N/A | `JoinByCodeModal` | New feature |

---

## 📝 Code Changes

### Old page.tsx
```tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch memberships
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user!.id)

  // Fetch trips
  const { data: tripsData } = await supabase
    .from('trips')
    .select('*')
    .in('id', tripIds)

  // Calculate counts
  const activeCount = trips.filter(t => !isTripPast(t)).length
  const historyCount = trips.filter(t => isTripPast(t)).length

  // Render
  return (
    <div>
      <h1>ทริปของฉัน</h1>
      <p>{activeCount} กำลังวางแผน · {historyCount} ไปแล้ว</p>
      <TripList trips={trips} memberCounts={memberCounts} userId={user!.id} />
    </div>
  )
}
```

### New page.tsx
```tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>กรุณาเข้าสู่ระบบ</div>
  }

  // Fetch user profile only
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name || 'ผู้ใช้'

  // Pass to client component
  return <DashboardClient userId={user.id} userName={userName} />
}
```

---

## 🎯 Feature Comparison

| Feature | Old | New |
|---------|-----|-----|
| Trip List | ✅ | ✅ |
| Active/History Split | ✅ | ✅ (improved) |
| RSVP Filtering | ❌ | ✅ (pending tab) |
| Real-time Updates | ❌ | ✅ |
| Join by Code | ❌ | ✅ |
| Cover Images | ❌ | ✅ |
| Avatar Stack | ❌ | ✅ |
| Pending Banner | ❌ | ✅ |
| Loading Skeleton | ❌ | ✅ |
| Empty States | Basic | Comprehensive |
| Mobile Responsive | Basic | Enhanced |

---

## 🚀 Migration Steps

### If You Have Custom Code

1. **Backup your old dashboard page**
   ```bash
   cp src/app/(app)/dashboard/page.tsx src/app/(app)/dashboard/page.tsx.backup
   ```

2. **Review your customizations**
   - Note any custom queries
   - Note any custom UI components
   - Note any business logic

3. **Integrate customizations**
   - Add custom queries to `useMyTrips.ts`
   - Add custom UI to `DashboardClient.tsx`
   - Add custom logic to appropriate components

4. **Test thoroughly**
   - All tabs work
   - Real-time updates work
   - Custom features still work

### If Using Default Dashboard

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Install dependencies** (if any new ones)
   ```bash
   npm install
   ```

3. **Run type check**
   ```bash
   npm run type-check
   ```

4. **Test the dashboard**
   ```bash
   npm run dev
   # Navigate to /dashboard
   ```

---

## 🔧 Customization Guide

### Add Custom Tab

```tsx
// 1. Update TripFilterTabs.tsx
const tabs: { key: TripFilter; label: string }[] = [
  { key: 'going', label: 'กำลังจะไป' },
  { key: 'pending', label: 'ต้องตอบรับ' },
  { key: 'completed', label: 'ผ่านไปแล้ว' },
  { key: 'custom', label: 'Custom Tab' }, // Add this
]

// 2. Update useMyTrips.ts grouping logic
const grouped: GroupedTrips = {
  going: [],
  pending: [],
  completed: [],
  custom: [], // Add this
}

// Add custom filtering logic
if (customCondition) {
  grouped.custom.push(trip)
}
```

### Add Custom Card Data

```tsx
// 1. Update DashboardTripCard.tsx
export function DashboardTripCard({ trip }: DashboardTripCardProps) {
  // Add your custom data extraction
  const customData = trip.custom_field
  
  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="...">
        {/* Existing card content */}
        
        {/* Add your custom section */}
        <div className="mt-2">
          <span>{customData}</span>
        </div>
      </div>
    </Link>
  )
}
```

### Add Custom Filter

```tsx
// 1. Update DashboardClient.tsx
const [customFilter, setCustomFilter] = useState<string>('')

// 2. Filter trips before passing to grid
const filteredTrips = currentTrips.filter(trip => {
  if (!customFilter) return true
  return trip.name.toLowerCase().includes(customFilter.toLowerCase())
})

// 3. Add filter UI
<input
  type="text"
  value={customFilter}
  onChange={(e) => setCustomFilter(e.target.value)}
  placeholder="ค้นหาทริป..."
/>
```

---

## 🐛 Troubleshooting

### Issue: Dashboard shows "กรุณาเข้าสู่ระบบ"
**Solution:** User authentication session expired. Login again.

### Issue: No trips showing
**Solution:** 
1. Check if user has any trip memberships in database
2. Check RLS policies are set correctly
3. Check console for errors

### Issue: Real-time not working
**Solution:**
1. Check Supabase Realtime is enabled for tables
2. Check RLS policies allow subscriptions
3. Check browser console for subscription errors

### Issue: Avatar not showing
**Solution:**
1. Check user has `name` in profiles table
2. Check DiceBear API is accessible
3. Check console for image load errors

### Issue: Join by code not working
**Solution:**
1. Check `invite_code` exists in trips table
2. Check `invite_code` is exactly 8 characters
3. Check RLS policy allows INSERT on trip_members

---

## 📊 Performance Comparison

| Metric | Old | New | Improvement |
|--------|-----|-----|-------------|
| Initial Load Queries | 3-4 | 3 | Similar |
| Component Re-renders | Medium | Optimized | Better |
| Real-time Updates | None | Yes | ✅ New |
| Code Splitting | No | Yes | ✅ Better |
| Loading States | Basic | Skeleton | ✅ Better |
| Mobile Performance | Good | Better | ✅ Improved |

---

## 🎓 Learning Resources

### New Concepts Used
1. **Client/Server Component Split** - Next.js 14 pattern
2. **Custom Hooks** - React best practice for logic reuse
3. **Real-time Subscriptions** - Supabase realtime
4. **Compound Components** - Modular component design
5. **Skeleton Loading** - Better perceived performance

### Recommended Reading
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✅ Migration Checklist

- [ ] Backed up old dashboard code
- [ ] Reviewed customizations
- [ ] Pulled latest changes
- [ ] Ran type check (no errors)
- [ ] Tested dashboard load
- [ ] Tested all 3 tabs
- [ ] Tested join by code
- [ ] Tested real-time updates
- [ ] Tested on mobile
- [ ] Integrated custom features
- [ ] Updated documentation
- [ ] Deployed to staging
- [ ] Tested on staging
- [ ] Deployed to production

---

## 🆘 Need Help?

1. Check [DASHBOARD-README.md](./DASHBOARD-README.md) for detailed docs
2. Check [DASHBOARD-ARCHITECTURE.md](./DASHBOARD-ARCHITECTURE.md) for technical details
3. Review component source code with JSDoc comments
4. Check browser console for errors
5. Check Supabase logs for API errors

---

**Migration Difficulty**: 🟢 Easy (if using default) | 🟡 Medium (if customized)  
**Estimated Time**: 15 minutes (testing) to 2 hours (custom integration)  
**Breaking Changes**: None (old components still available)
