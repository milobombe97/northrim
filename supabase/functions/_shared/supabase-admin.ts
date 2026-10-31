import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

export type ProfileRow = {
  id: string
  email: string
  first_name: string
  last_name: string
  status: string
}

export type TransactionRow = {
  id: string
  user_id: string
  account_id: string
  name: string
  category: string
  amount: number
  status: string | null
}

export type ReceiptRow = {
  id: string
  user_id: string
  amount: number
  currency: string
  status: string
  rejection_reason: string | null
}

export type KycRow = {
  id: string
  user_id: string
  id_type: string
  status: string
  rejection_reason: string | null
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function getProfile(userId: string) {
  const { data, error } = await adminClient()
    .from('profiles')
    .select('id, email, first_name, last_name, status')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as ProfileRow | null
}

export async function getAccountCurrency(userId: string, accountCode: string) {
  const { data, error } = await adminClient()
    .from('accounts')
    .select('currency')
    .eq('user_id', userId)
    .eq('code', accountCode)
    .maybeSingle()
  if (error) throw error
  return (data?.currency as string | undefined) ?? 'USD'
}

export async function getAccountLabel(userId: string, accountCode: string) {
  const { data, error } = await adminClient()
    .from('accounts')
    .select('name, currency')
    .eq('user_id', userId)
    .eq('code', accountCode)
    .maybeSingle()
  if (error) throw error
  if (!data) return accountCode
  return `${data.name as string} (${data.currency as string})`
}

export async function getTransaction(id: string) {
  const { data, error } = await adminClient().from('transactions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as TransactionRow | null
}
