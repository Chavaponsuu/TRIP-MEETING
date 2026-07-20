# Onboarding Feature — Deployment Checklist

## Pre-Deployment

### Development
- [x] Install dependencies (@dicebear/collection)
- [x] Create migration files (000034)
- [x] Create UserAvatar component
- [x] Create onboarding page
- [x] Create onboarding layout
- [x] Update app layout with guard
- [x] Update types (Profile interface)
- [x] Update next.config.ts (image domain)
- [x] Write documentation

### Testing (Local)
- [ ] Run `npm run type-check` → No errors in new files
- [ ] Run `npm run lint` → No critical errors
- [ ] Run `npm run dev` → Server starts successfully
- [ ] Test new user registration flow
- [ ] Test existing user login flow
- [ ] Test onboarding form validation
- [ ] Test avatar preview debounce
- [ ] Test successful onboarding submission
- [ ] Test redirect after onboarding
- [ ] Test already-onboarded redirect

### Code Review
- [ ] Review migration SQL syntax
- [ ] Review component code quality
- [ ] Review TypeScript types
- [ ] Review validation logic
- [ ] Review security (SQL injection, XSS)
- [ ] Review performance (debounce, image loading)
- [ ] Review accessibility (alt text, labels)
- [ ] Review mobile responsiveness

## Deployment

### Phase 1: Database Migration
- [ ] Backup database (Supabase dashboard)
- [ ] Open Supabase SQL Editor
- [ ] Copy SQL from `migrations/000034_add_onboarding_to_profiles.up.sql`
- [ ] Execute migration
- [ ] Verify column exists:
  ```sql
  select column_name, data_type 
  from information_schema.columns
  where table_name = 'profiles' 
    and column_name = 'onboarded_at';
  ```
- [ ] Verify backfill results:
  ```sql
  select 
    count(*) as total,
    count(onboarded_at) as onboarded,
    count(*) - count(onboarded_at) as need_onboarding
  from profiles;
  ```
- [ ] Check sample users:
  ```sql
  select id, name, created_at, onboarded_at 
  from profiles 
  limit 10;
  ```

### Phase 2: Code Deployment
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "feat: add first-time onboarding with DiceBear avatars"
  ```
- [ ] Push to repository:
  ```bash
  git push origin main
  ```
- [ ] Wait for Vercel deployment
- [ ] Check Vercel build logs → No errors
- [ ] Verify deployment status → Success

### Phase 3: Smoke Testing (Production)
- [ ] Visit production URL
- [ ] Test: Register new account
  - [ ] Redirects to /onboarding
  - [ ] Form displays correctly
  - [ ] Avatar preview works
  - [ ] Validation works (too short, too long)
  - [ ] Submission works
  - [ ] Redirects to /dashboard
  - [ ] Avatar shows in app
- [ ] Test: Existing user login
  - [ ] Goes directly to /dashboard
  - [ ] No onboarding screen
  - [ ] Profile intact
- [ ] Test: Navigate to /onboarding manually (after onboarded)
  - [ ] Redirects to /dashboard
- [ ] Check browser console → No JavaScript errors
- [ ] Check Network tab → Avatar loads correctly
- [ ] Check mobile view → Layout responsive

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for failed queries
- [ ] Monitor user onboarding completion rate
- [ ] Check for reported bugs
- [ ] Monitor DiceBear API response times

### Metrics to Track
```sql
-- New users in last 24h
select count(*) 
from profiles 
where created_at > now() - interval '24 hours';

-- Onboarding completion in last 24h
select 
  count(*) filter (where created_at > now() - interval '24 hours') as new_users,
  count(*) filter (where onboarded_at > now() - interval '24 hours') as completed,
  round(100.0 * 
    count(*) filter (where onboarded_at > now() - interval '24 hours') / 
    count(*) filter (where created_at > now() - interval '24 hours'), 2
  ) as completion_rate
from profiles;

-- Average time to complete onboarding
select 
  avg(extract(epoch from (onboarded_at - created_at))) as avg_seconds
from profiles
where onboarded_at > now() - interval '24 hours'
  and created_at > now() - interval '24 hours';
```

### Success Criteria
- [ ] Onboarding completion rate > 95%
- [ ] Average completion time < 30 seconds
- [ ] Zero critical errors in logs
- [ ] Avatar load success rate > 99%
- [ ] No user complaints about being stuck

### Known Issues to Watch
- [ ] Users stuck on onboarding (profile update fails)
- [ ] Avatar images not loading (DiceBear API down)
- [ ] Existing users forced to onboard (backfill missed)
- [ ] Redirect loops (logic error)
- [ ] Validation too strict (cultural names)

## Rollback Plan

### If Critical Issues Found

#### Quick Fix: Disable Onboarding Check
Edit `src/app/(app)/layout.tsx`:
```typescript
// Comment out temporarily:
/*
if (profile && !profile.onboarded_at) {
  redirect('/onboarding')
}
*/
```

Deploy immediately:
```bash
git add src/app/(app)/layout.tsx
git commit -m "hotfix: temporarily disable onboarding"
git push origin main
```

#### Full Rollback: Revert Code
```bash
# Find commit hash before onboarding feature
git log --oneline | head -10

# Revert to previous commit
git revert <commit-hash>
git push origin main
```

#### Database Rollback: Remove Column
```sql
-- Only if absolutely necessary!
alter table profiles drop column if exists onboarded_at;
```

**⚠️ Warning:** Database rollback will lose onboarding timestamp data!

## Communication Plan

### Stakeholders to Notify
- [ ] Development team
- [ ] Product team
- [ ] Support team
- [ ] Users (if significant change)

### Deployment Announcement Template
```
🚀 Deployment: First-Time Onboarding Feature

WHEN: [Date/Time]
DURATION: ~5 minutes downtime for migration

CHANGES:
• New users will set nickname on first login
• Automatic avatar generation (DiceBear)
• Existing users unaffected

IMPACT:
• Low - only affects new registrations
• Existing users will not see any changes

ROLLBACK PLAN:
• Available if critical issues found
• Can disable feature without data loss

STATUS: [Scheduled/In Progress/Complete]
```

## Documentation Handoff

### For Support Team
- [ ] Share `ONBOARDING-QUICKSTART.md`
- [ ] Explain expected user flow
- [ ] Provide SQL queries for debugging
- [ ] Document rollback procedure

### For Development Team
- [ ] Share `ONBOARDING-FEATURE.md`
- [ ] Share `ONBOARDING-FLOW.md`
- [ ] Update project README if needed
- [ ] Add to CHANGELOG

### For Product Team
- [ ] Share success metrics queries
- [ ] Explain completion rate tracking
- [ ] Discuss future enhancements (upload feature)

## Sign-Off

### Pre-Deployment Approval
- [ ] Lead Developer: _______________
- [ ] DevOps: _______________
- [ ] Product Owner: _______________

### Post-Deployment Confirmation
- [ ] Migration Successful: _______________
- [ ] Code Deployed: _______________
- [ ] Smoke Tests Passed: _______________
- [ ] Monitoring Active: _______________

### 24-Hour Review
- [ ] No Critical Issues: _______________
- [ ] Metrics Acceptable: _______________
- [ ] Feature Stable: _______________

## Notes

### Deployment Date: _______________
### Deployed By: _______________
### Issues Encountered:
```
1. 
2. 
3. 
```

### Lessons Learned:
```
1. 
2. 
3. 
```

---

**Remember:**
- Migration MUST run before code deployment
- Test thoroughly in staging first
- Have rollback plan ready
- Monitor closely for first 24 hours
- Communicate with team throughout process

**Support Contact:**
- Lead Developer: [name/email]
- DevOps: [name/email]
- On-call: [name/phone]
