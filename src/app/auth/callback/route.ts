import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  // In production, always use the configured APP_URL as the redirect base.
  // Using `origin` directly would pick up Vercel preview-deploy domains that
  // are not whitelisted in Supabase, causing "callback failed" errors.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const base = isLocalEnv
    ? origin
    : process.env.NEXT_PUBLIC_APP_URL ??
      (forwardedHost ? `https://${forwardedHost}` : origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${base}${redirect}`)
    }
    console.error('Auth callback error during exchangeCodeForSession:', error)
  }

  return NextResponse.redirect(`${base}/login?error=auth`)
}
