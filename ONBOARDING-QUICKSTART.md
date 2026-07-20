# Onboarding Feature — Quick Start Guide

## 🚀 Deploy in 5 Steps

### 1. Install Dependencies
```bash
npm install @dicebear/collection
```

### 2. Apply Database Migration

Open Supabase SQL Editor and run:

```sql
-- Add onboarded_at column
alter table profiles add column onboarded_at timestamptz;

-- Backfill existing users
update profiles
set onboarded_at = created_at
where name is not null and trim(name) <> '';

-- Add comment
comment on column profiles.onboarded_at is 'Timestamp when user completed onboarding. NULL means user needs to complete onboarding.';
```

Verify:
```sql
select count(*) as total, 
       count(onboarded_at) as onboarded,
       count(*) - count(onboarded_at) as needs_onboarding
from profiles;
```

### 3. Build & Test Locally
```bash
npm run dev
```

Visit http://localhost:3000 and:
1. Create a new test account
2. Verify redirect to `/onboarding`
3. Enter nickname and submit
4. Verify redirect to `/dashboard`

### 4. Deploy
```bash
# Commit changes
git add .
git commit -m "feat: add first-time onboarding with DiceBear avatars"

# Push to trigger Vercel deployment
git push origin main
```

### 5. Monitor
After deployment, check:
- [ ] New user registrations → onboarding page
- [ ] Existing users → direct to dashboard
- [ ] Avatars loading correctly
- [ ] No errors in Vercel logs

## 🧪 Testing Scenarios

### Test Case 1: New User
```
1. Navigate to /register
2. Create account
3. Expected: Redirect to /onboarding
4. Enter nickname "TestUser"
5. Expected: Avatar preview shows
6. Click "เริ่มใช้งาน"
7. Expected: Redirect to /dashboard
8. Expected: Avatar shows in header
```

### Test Case 2: Existing User
```
1. Login with existing account
2. Expected: Direct to /dashboard (no onboarding)
3. Expected: Profile data intact
```

### Test Case 3: Already Onboarded
```
1. Complete onboarding as new user
2. Manually navigate to /onboarding
3. Expected: Redirect to /dashboard
```

## 📝 Files Created/Modified

### New Files (7)
```
migrations/000034_add_onboarding_to_profiles.up.sql
migrations/000034_add_onboarding_to_profiles.down.sql
migrations/APPLY_MIGRATION_034.md
src/components/UserAvatar.tsx
src/app/onboarding/page.tsx
src/app/onboarding/layout.tsx
ONBOARDING-FEATURE.md
```

### Modified Files (3)
```
src/types/index.ts (added onboarded_at to Profile)
src/app/(app)/layout.tsx (added onboarding check)
next.config.ts (added DiceBear domain)
```

## ⚙️ Configuration

### Environment Variables
No new env vars needed! Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Feature Flags
None required. Feature auto-activates after migration.

## 🐛 Common Issues

### Issue: Avatar not showing
**Solution:** Check Next.js config has:
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'api.dicebear.com', pathname: '/**' }
  ]
}
```

### Issue: Redirect loop
**Solution:** Check profile has `onboarded_at` set:
```sql
select id, name, onboarded_at from profiles where id = '<user-id>';
```

### Issue: Existing users forced to onboard
**Solution:** Run backfill again:
```sql
update profiles 
set onboarded_at = created_at 
where name is not null and onboarded_at is null;
```

## 🎯 Success Metrics

Monitor these after deployment:
- **Onboarding completion rate:** Should be >95%
- **Time to complete:** Average 10-20 seconds
- **Drop-off rate:** Should be <5%
- **Avatar load errors:** Should be 0%

Query to check:
```sql
-- Onboarding stats
select 
  count(*) filter (where created_at > now() - interval '7 days') as new_users_week,
  count(*) filter (where onboarded_at is not null and created_at > now() - interval '7 days') as completed_week,
  round(100.0 * count(*) filter (where onboarded_at is not null) / count(*), 2) as completion_rate
from profiles
where created_at > now() - interval '7 days';
```

## 📚 Documentation

- Full feature docs: `ONBOARDING-FEATURE.md`
- Migration guide: `migrations/APPLY_MIGRATION_034.md`
- Project guide: `AGENTS.md` (reference this feature)

## ✅ Deployment Checklist

Pre-deployment:
- [ ] Dependencies installed
- [ ] Migration tested locally
- [ ] Type checks pass
- [ ] Lint passes
- [ ] Manual testing completed

Deployment:
- [ ] Migration applied to production DB
- [ ] Code deployed to Vercel
- [ ] Health check passed
- [ ] New user test account created

Post-deployment:
- [ ] Monitor error logs (24h)
- [ ] Check onboarding completion rate
- [ ] Verify avatar loading performance
- [ ] Gather user feedback

## 🔄 Rollback Plan

If issues occur:

1. **Disable onboarding check** (quick fix):
```typescript
// In src/app/(app)/layout.tsx
// Comment out the onboarding check temporarily:
/*
if (profile && !profile.onboarded_at) {
  redirect('/onboarding')
}
*/
```

2. **Revert migration** (if needed):
```sql
alter table profiles drop column if exists onboarded_at;
```

3. **Redeploy previous version**:
```bash
git revert <commit-hash>
git push origin main
```

## 🎉 You're Done!

New users will now see a beautiful onboarding experience with automatically generated avatars!

**Next steps:**
- Consider adding analytics tracking
- Plan for profile photo upload feature
- Gather user feedback on nickname UX
