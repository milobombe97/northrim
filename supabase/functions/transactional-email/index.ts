import { dispatchTransactionalEmail } from '../_shared/dispatch.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const secret = Deno.env.get('EMAIL_WEBHOOK_SECRET') ?? Deno.env.get('SUPABASE_WEBHOOK_SECRET')
  const incoming = req.headers.get('x-webhook-secret')
  if (!secret || incoming !== secret) {
    console.error('[transactional-email] invalid webhook secret')
    return unauthorized()
  }

  try {
    const payload = await req.json()
    console.log('[transactional-email] payload', {
      type: payload?.type,
      table: payload?.table,
      id: payload?.record?.id,
    })

    const result = await dispatchTransactionalEmail(payload)
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[transactional-email] error', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
