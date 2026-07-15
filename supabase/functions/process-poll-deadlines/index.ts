import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Invoked by pg_cron every 5 minutes via pg_net HTTP POST.
// Closes all polls whose deadline has passed.
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // Fetch all open polls past their deadline
  const { data: expiredPolls, error: fetchError } = await supabase
    .from('polls')
    .select('id, title, trip_id, deadline')
    .eq('status', 'open')
    .not('deadline', 'is', null)
    .lte('deadline', new Date().toISOString())

  if (fetchError) {
    console.error('[process-poll-deadlines] Failed to fetch expired polls:', fetchError.message)
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!expiredPolls || expiredPolls.length === 0) {
    console.log('[process-poll-deadlines] No expired polls found.')
    return new Response(
      JSON.stringify({ closed: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[process-poll-deadlines] Found ${expiredPolls.length} expired poll(s). Processing…`)

  const results: { id: string; success: boolean; error?: string }[] = []

  // Process each poll individually — errors on one must not abort the batch
  for (const poll of expiredPolls) {
    const { error: updateError } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', poll.id)
      .eq('status', 'open') // guard against race condition

    if (updateError) {
      console.error(
        `[process-poll-deadlines] Failed to close poll ${poll.id} ("${poll.title}"):`,
        updateError.message
      )
      results.push({ id: poll.id, success: false, error: updateError.message })
    } else {
      console.log(
        `[process-poll-deadlines] Closed poll ${poll.id} ("${poll.title}") — deadline was ${poll.deadline}`
      )
      results.push({ id: poll.id, success: true })
    }
  }

  const closedCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  return new Response(
    JSON.stringify({
      processed: expiredPolls.length,
      closed: closedCount,
      failed: failedCount,
      results,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
