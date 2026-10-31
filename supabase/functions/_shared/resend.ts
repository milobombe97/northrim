import { Resend } from 'npm:resend@4.0.0'
import { ADMIN_EMAIL, FROM_EMAIL, REPLY_TO_EMAIL } from './constants.ts'
import { buildPlainBody, complianceHeaders } from './emailStandards.ts'

export type OutboundEmail = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  ccAdmin?: boolean
  /** Used for List-Unsubscribe context, Resend tags, and X-Entity-Ref-ID when set. */
  category?: string
  referenceId?: string
}

let client: Resend | null = null

function getResend() {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  if (!client) client = new Resend(key)
  return client
}

function normalizeCategory(category?: string) {
  return (category ?? 'transactional').replace(/[^a-z0-9_-]/gi, '_').slice(0, 48)
}

export async function sendEmail(message: OutboundEmail) {
  const to = Array.isArray(message.to) ? message.to : [message.to]
  const cc = message.ccAdmin ? [ADMIN_EMAIL] : undefined
  const category = normalizeCategory(message.category)
  const text = message.text ?? buildPlainBody(message.html, message.referenceId)
  const headers = complianceHeaders({ category, referenceId: message.referenceId })

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to,
    cc,
    subject: message.subject,
    html: message.html,
    text,
    headers,
    tags: [
      { name: 'category', value: category },
      { name: 'stream', value: 'transactional' },
    ],
  })

  if (error) {
    console.error('[resend] send failed', { error, to, subject: message.subject, category })
    throw new Error(error.message)
  }

  console.log('[resend] sent', { id: data?.id, to, subject: message.subject, category })
  return data
}

export async function sendAdminOnly(message: {
  subject: string
  html: string
  text?: string
  category?: string
  referenceId?: string
}) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: message.subject,
    html: message.html,
    text: message.text,
    category: message.category ?? 'admin',
    referenceId: message.referenceId,
    ccAdmin: false,
  })
}
