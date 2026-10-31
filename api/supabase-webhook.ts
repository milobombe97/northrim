/**
 * @deprecated Use Supabase Edge Function `transactional-email` + Database Webhooks.
 * See supabase/EMAIL_SETUP.md
 */
export default async function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  return res.status(410).json({
    error: 'Deprecated',
    message: 'Configure Database Webhooks to call supabase/functions/transactional-email instead.',
    docs: 'supabase/EMAIL_SETUP.md',
  })
}
