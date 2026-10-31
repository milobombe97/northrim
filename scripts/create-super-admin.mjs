/**
 * Create or reset a super admin (Supabase Auth + profiles.role = super).
 *
 * Usage (service role from Dashboard → Settings → API):
 *   set SUPABASE_URL=https://YOUR_REF.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   node scripts/create-super-admin.mjs
 *
 * Optional env: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_FIRST_NAME, SUPER_ADMIN_LAST_NAME
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const url = process.env.SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const email = (process.env.SUPER_ADMIN_EMAIL ?? 'admin@northrimbankinc.com').trim().toLowerCase()
const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? 'North Rim'
const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? 'Super Admin'
let password = process.env.SUPER_ADMIN_PASSWORD?.trim()

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

if (!password || password.length < 8) {
  password = randomBytes(12).toString('base64url')
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function findUserIdByEmail(targetEmail) {
  const { data, error } = await admin.from('profiles').select('id, role').ilike('email', targetEmail).maybeSingle()
  if (error) throw error
  if (data?.id) return data.id

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError
  const match = list.users.find((u) => u.email?.trim().toLowerCase() === targetEmail)
  return match?.id ?? null
}

async function main() {
  let userId = await findUserIdByEmail(email)

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    })
    if (error) throw error
    userId = data.user?.id
    if (!userId) throw new Error('User was not created.')
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })
    if (error) throw error
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'super',
      status: 'active',
      kyc_status: 'not_started',
      phone: '',
    },
    { onConflict: 'id' },
  )
  if (profileError) throw profileError

  console.log(JSON.stringify({ email, password, adminLoginUrl: 'https://www.northrimbankinc.com/admin/login' }, null, 2))
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
