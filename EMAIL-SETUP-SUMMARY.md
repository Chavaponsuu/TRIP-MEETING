# Email Notifications - Quick Setup Summary (Gmail SMTP)

## What Was Done

✅ Updated Edge Function to use Gmail SMTP instead of Resend  
✅ Using Supabase Database Webhooks (no pg_net extension needed)  
✅ Cleaned up database triggers causing errors  
✅ Documentation updated for Gmail setup  

## Quick Start (3 Steps)

### 1. Run Migration (Fix Current Error)

Run in Supabase SQL Editor:
```sql
drop trigger if exists on_trip_invitation_created on trip_invitations;
drop trigger if exists on_trip_invitation_notify on trip_invitations;
drop function if exists send_trip_invitation_email();
drop function if exists notify_trip_invitation();
```

**This fixes the immediate "schema net does not exist" error!**

### 2. Set Up Gmail App Password

1. Enable 2FA on Gmail: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password (remove spaces)

3. Add secrets in Supabase:
   ```bash
   supabase secrets set GMAIL_USER=your-email@gmail.com
   supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
   supabase secrets set APP_URL=https://trip-meeting.vercel.app
   ```

### 3. Deploy Function & Create Webhook

```bash
# Deploy function
supabase functions deploy send-trip-invitation-email

# Then in Supabase Dashboard:
# Database → Webhooks → Create webhook
# - Table: trip_invitations
# - Event: INSERT
# - URL: https://your-project.supabase.co/functions/v1/send-trip-invitation-email
# - Header: Authorization = Bearer your_anon_key
```

## Gmail Limits

- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day

Perfect for small-medium apps. For higher volume, consider SendGrid or Mailgun.

## Files Structure

**Keep:**
- ✅ `supabase/functions/send-trip-invitation-email/index.ts` - Edge Function (Gmail SMTP)
- ✅ `supabase/migration-email-cleanup.sql` - Database cleanup migration
- ✅ `EMAIL-NOTIFICATIONS-SETUP.md` - Full Gmail setup guide

## Current Status

🔴 **Not working yet** - Run Step 1 migration to fix the error  
🟡 **Ready to set up** - Follow Steps 2-3 to enable Gmail notifications  
🟢 **Invitations work** - After Step 1, inviting friends will work (just no emails yet)  

## Next Steps

1. **Immediate:** Run the migration (Step 1) to fix the error
2. **When ready:** Set up Gmail app password (Step 2)
3. **Deploy:** Deploy function and create webhook (Step 3)

See `EMAIL-NOTIFICATIONS-SETUP.md` for detailed instructions.
