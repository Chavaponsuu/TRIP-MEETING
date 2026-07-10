import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const GMAIL_USER = Deno.env.get('GMAIL_USER') // your-email@gmail.com
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') // App-specific password
const APP_URL = Deno.env.get('APP_URL') || 'https://trip-meeting.vercel.app'

interface InvitationPayload {
  type: 'INSERT'
  table: 'trip_invitations'
  record: {
    id: string
    trip_id: string
    inviter_id: string
    invitee_id: string
    status: string
  }
}

serve(async (req) => {
  try {
    console.log('=== Email Function Started ===')
    console.log('Environment check:', {
      hasGmailUser: !!GMAIL_USER,
      hasGmailPassword: !!GMAIL_APP_PASSWORD,
      appUrl: APP_URL,
    })

    const payload: InvitationPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2))
    
    // Only send email for new pending invitations
    if (payload.type !== 'INSERT' || payload.record.status !== 'pending') {
      console.log('Skipping: Not a pending insert')
      return new Response('OK', { status: 200 })
    }

    // Check if Gmail credentials are set
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('ERROR: Gmail credentials not set!')
      console.log('GMAIL_USER:', GMAIL_USER ? 'SET' : 'NOT SET')
      console.log('GMAIL_APP_PASSWORD:', GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET')
      throw new Error('Gmail credentials not configured')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching data from Supabase...')

    // Get inviter info
    const { data: inviter, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', payload.record.inviter_id)
      .single()

    if (inviterError) console.error('Inviter fetch error:', inviterError)

    const { data: { user: inviterUser }, error: inviterUserError } = await supabaseClient.auth.admin.getUserById(
      payload.record.inviter_id
    )

    if (inviterUserError) console.error('Inviter user error:', inviterUserError)

    // Get invitee email
    const { data: { user: inviteeUser }, error: inviteeUserError } = await supabaseClient.auth.admin.getUserById(
      payload.record.invitee_id
    )

    if (inviteeUserError) console.error('Invitee user error:', inviteeUserError)

    // Get trip info
    const { data: trip, error: tripError } = await supabaseClient
      .from('trips')
      .select('name, destination, emoji')
      .eq('id', payload.record.trip_id)
      .single()

    if (tripError) console.error('Trip fetch error:', tripError)

    console.log('Data fetched:', {
      hasInviter: !!inviter,
      hasInviterUser: !!inviterUser,
      hasInviteeUser: !!inviteeUser,
      hasTrip: !!trip,
      inviteeEmail: inviteeUser?.email,
    })

    if (!inviter || !inviterUser || !inviteeUser || !trip) {
      throw new Error('Missing required data')
    }

    console.log('Initializing SMTP client...')

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER!,
          password: GMAIL_APP_PASSWORD!,
        },
      },
    })

    console.log('Sending email to:', inviteeUser.email)

    // Send email using Gmail SMTP
    await client.send({
      from: GMAIL_USER!,
      to: inviteeUser.email!,
      subject: `${inviter.name} ชวนคุณเข้าร่วมทริป ${trip.emoji} ${trip.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #5B6FF5; margin: 0; font-size: 28px;">${trip.emoji}</h1>
          </div>
          
          <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">คำเชิญเข้าร่วมทริป</h2>
          
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
            <strong>${inviter.name}</strong> ชวนคุณเข้าร่วมทริป
          </p>
          
          <div style="background: #F8F9FF; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #E5E7EB;">
            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">${trip.emoji} ${trip.name}</h3>
            <p style="margin: 0; color: #6B7280; font-size: 16px;">📍 ${trip.destination}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${APP_URL}/friends" 
               style="display: inline-block; background: #5B6FF5; color: white; padding: 14px 32px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ดูคำเชิญและตอบกลับ
            </a>
          </div>
          
          <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-top: 32px;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 8px 0;">
              หรือคัดลอกลิงก์นี้ไปยังเบราว์เซอร์:
            </p>
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              <a href="${APP_URL}/friends" style="color: #5B6FF5; text-decoration: none;">
                ${APP_URL}/friends
              </a>
            </p>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0; text-align: center;">
              คุณได้รับอีเมลนี้เพราะมีคนชวนคุณเข้าร่วมทริปใน TripMeet
            </p>
          </div>
        </div>
      `,
    })

    console.log('Email sent successfully!')
    await client.close()
    console.log('SMTP connection closed')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('=== ERROR ===')
    console.error('Error sending invitation email:', error)
    console.error('Error stack:', (error as Error).stack)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
