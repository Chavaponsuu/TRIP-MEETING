# Email Notifications Setup Guide (Gmail SMTP)

This guide will help you set up email notifications for trip invitations using Gmail SMTP.

## Overview

When a user invites a friend to a trip, the friend will receive an email notification with:
- The inviter's name
- Trip name, emoji, and destination
- A button to view and respond to the invitation

## Architecture

**Database Webhook → Edge Function → Gmail SMTP**

When a row is inserted into `trip_invitations`, Supabase automatically triggers the Edge Function which sends the email via Gmail.

## Prerequisites

1. **Gmail Account**
   - A Gmail account to send emails from
   - App-specific password (2FA required)

2. **Supabase CLI** (for deploying Edge Functions)
   ```bash
   brew install supabase/tap/supabase
   # or
   npm install -g supabase
   ```

## Setup Steps

### Step 1: Run Database Migration

Run `supabase/migration-email-cleanup.sql` in Supabase SQL Editor:

```sql
-- This removes any old database triggers
drop trigger if exists on_trip_invitation_created on trip_invitations;
drop trigger if exists on_trip_invitation_notify on trip_invitations;
drop function if exists send_trip_invitation_email();
drop function if exists notify_trip_invitation();
```

**This fixes the "schema net does not exist" error!**

### Step 2: Set Up Gmail App Password

Gmail requires an app-specific password for SMTP access:

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification" and follow the setup

2. **Create App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "TripMeet" or "Supabase"
   - Click "Generate"
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Supabase Secrets

Add environment variables for the Edge Function:

**Via Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add these secrets:

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop (no spaces)
APP_URL=https://trip-meeting.vercel.app
```

**Via Supabase CLI:**
```bash
supabase secrets set GMAIL_USER=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
supabase secrets set APP_URL=https://trip-meeting.vercel.app
```

**Important:** Remove spaces from the app password!

### Step 4: Deploy Edge Function

1. Link to your Supabase project (first time only):
```bash
supabase link --project-ref your-project-ref
```

2. Deploy the function:
```bash
supabase functions deploy send-trip-invitation-email
```

### Step 5: Set Up Database Webhook

1. Go to **Database** → **Webhooks** in Supabase Dashboard
2. Click **Create a new hook**
3. Configure:
   - **Name**: `send-trip-invitation-email`
   - **Table**: `trip_invitations`
   - **Events**: Check **Insert** only
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://your-project-ref.supabase.co/functions/v1/send-trip-invitation-email`
   - **HTTP Headers**: Add header
     - Key: `Authorization`
     - Value: `Bearer your_anon_key`
4. Click **Create webhook**

**Finding your values:**
- Project ref: In your Supabase URL (e.g., `https://abcdefgh.supabase.co` → `abcdefgh`)
- Anon key: Settings → API → Project API keys → `anon` `public`

## Testing

### Test the Email Notification

1. Invite a friend to a trip in your app
2. Check the invitee's email inbox (including spam folder)
3. Check Edge Function logs:
   ```bash
   supabase functions logs send-trip-invitation-email
   ```

### Check Logs in Dashboard

- **Edge Function logs**: Edge Functions → `send-trip-invitation-email` → Logs
- **Webhook logs**: Database → Webhooks → Click on your webhook → View logs

## Troubleshooting

### Emails not sending

1. **Check webhook is active:**
   - Database → Webhooks → Ensure status is "Enabled"
   - Check webhook logs for errors

2. **Check Edge Function logs:**
   ```bash
   supabase functions logs send-trip-invitation-email
   ```
   Or in Dashboard: Edge Functions → send-trip-invitation-email → Logs

3. **Verify secrets are set:**
   ```bash
   supabase secrets list
   ```

4. **Test Gmail credentials manually:**
   - Try logging into Gmail with your app password
   - Make sure 2FA is enabled

### Common Issues

**"Invalid credentials" or "Authentication failed"**
- Verify `GMAIL_USER` is correct (your full Gmail address)
- Verify `GMAIL_APP_PASSWORD` has no spaces
- Make sure you're using an app password, not your regular Gmail password
- Ensure 2-Factor Authentication is enabled on your Gmail account

**"Connection refused" or "Timeout"**
- Gmail SMTP might be blocked by your network
- Try using port 587 with STARTTLS instead (edit the function)
- Check if Gmail SMTP is enabled in your account settings

**Emails going to spam**
- This is common with Gmail SMTP from new senders
- Ask recipients to mark as "Not spam"
- Consider using a professional email service for production (SendGrid, Mailgun, etc.)

**Webhook not triggering**
- Check the webhook URL is correct
- Verify the `Authorization` header has the correct anon key
- Check webhook logs for HTTP errors

**Function timeout**
- Edge Functions have a 120-second timeout
- SMTP connections might be slow; this is normal
- Check function logs for errors

## Gmail Limitations

**Sending Limits:**
- Free Gmail: 500 emails/day
- Google Workspace: 2,000 emails/day

**Best Practices:**
- Don't use your personal Gmail for production
- Consider dedicated email service (SendGrid, Mailgun, AWS SES) for higher volume
- Monitor your sending limits

## Alternative SMTP Settings

If you want to use STARTTLS instead of SSL:

Edit the Edge Function to use port 587:

```typescript
const client = new SMTPClient({
  connection: {
    hostname: 'smtp.gmail.com',
    port: 587,  // Changed from 465
    tls: true,
    auth: {
      username: GMAIL_USER!,
      password: GMAIL_APP_PASSWORD!,
    },
  },
})
```

## Email Template Customization

Edit `supabase/functions/send-trip-invitation-email/index.ts` to customize:

- Subject line
- Email HTML template
- Styling
- Button text and links

After changes, redeploy:
```bash
supabase functions deploy send-trip-invitation-email
```

## Production Recommendations

For production, consider:

1. **Use a dedicated email address** (e.g., notifications@yourdomain.com)
2. **Set up SPF/DKIM/DMARC records** for better deliverability
3. **Monitor sending quotas** to avoid hitting Gmail limits
4. **Use a professional email service** (SendGrid, Mailgun, AWS SES) for higher volume and better deliverability

## Cost

**Gmail SMTP: Free**
- Up to 500 emails/day (free Gmail)
- Up to 2,000 emails/day (Google Workspace - $6/user/month)

**Alternatives:**
- SendGrid: 100 emails/day free, then $15/month for 40k emails
- Mailgun: 5,000 emails/month free for 3 months
- AWS SES: $0.10 per 1,000 emails

## Next Steps

After emails are working:
- [ ] Add email notification settings for users (opt-in/opt-out)
- [ ] Add email notifications for friend requests
- [ ] Monitor email delivery rates
- [ ] Consider upgrading to professional email service for production
