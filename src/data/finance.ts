import { loadAccount, loadClients } from '../auth/session'
import { ensureCanTransact } from './adminAccounts'
import { loadPostedBalances, savePostedBalances } from './balances'
import { ledgerKey, type Transaction } from './banking'
import { sortTransactions } from './transactionsView'
import { fetchStaffRole } from './remote'
import { supabase } from '../lib/supabase'

export type WithdrawalRequest = {
  id: string
  user_id: string
  account_code: string
  amount: number
  currency: string
  payee_name: string
  method: string
  country: string
  transaction_id: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
}

export async function pullAccountBalances(userId?: string) {
  if (!supabase) return
  const { data: auth } = await supabase.auth.getUser()
  const target = userId || auth.user?.id
  if (!target) return

  const { data, error } = await supabase.from('accounts').select('code, balance').eq('user_id', target)
  if (error || !data) return

  const map: Record<string, number> = {}
  for (const row of data) {
    map[row.code as string] = Number(row.balance)
  }
  savePostedBalances(target, map)
}

export async function pullAllClientBalances() {
  if (!supabase) return
  const { data, error } = await supabase.from('accounts').select('user_id, code, balance')
  if (error || !data) return
  for (const row of data) {
    const userId = row.user_id as string
    const current = loadPostedBalances(userId) ?? {}
    current[row.code as string] = Number(row.balance)
    savePostedBalances(userId, current)
  }
}

export async function pullFinancialState(userId?: string) {
  const remote = await import('./remote')
  const id = userId || loadAccount()?.id
  if (!id) return
  await pullAccountBalances(id)
  await remote.pullTransactionsForUser(id)
}

/** Keep balances and activity in sync while the dashboard is open (incoming transfers, admin approvals). */
export function subscribeFinancialSync(userId: string | undefined) {
  const client = supabase
  if (!userId || !client) return () => {}

  void pullFinancialState(userId)

  const channel = client
    .channel(`financial-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      () => {
        void pullFinancialState(userId)
      },
    )
    .subscribe()

  const refresh = () => {
    void pullFinancialState(userId)
  }
  window.addEventListener('focus', refresh)
  const onVisible = () => {
    if (document.visibilityState === 'visible') refresh()
  }
  document.addEventListener('visibilitychange', onVisible)
  const interval = window.setInterval(refresh, 45_000)

  return () => {
    void client.removeChannel(channel)
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', onVisible)
    window.clearInterval(interval)
  }
}

function blockIfInactive() {
  const message = ensureCanTransact(loadAccount())
  return message ? { error: message } : null
}

export async function submitReceiptRecord(input: {
  accountCode: string
  amount: number
  currency: string
  storagePath: string
  fileName: string
  transactionId: string
}) {
  const inactive = blockIfInactive()
  if (inactive) return inactive
  if (!supabase) return { ok: true as const }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: 'Sign in to upload a receipt.' }

  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter a valid top-up amount before sending the receipt.' }
  }

  const { data: existing } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('transaction_id', input.transactionId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing?.id) return { ok: true as const }

  const { error } = await supabase.from('receipts').insert({
    user_id: auth.user.id,
    account_code: input.accountCode,
    amount,
    currency: input.currency,
    storage_path: input.storagePath,
    file_name: input.fileName,
    transaction_id: input.transactionId,
    status: 'pending',
  })

  if (error) return { error: error.message }
  return { ok: true as const }
}

export async function adminAdjustBalance(
  userId: string,
  accountCode: string,
  delta: number,
  label?: string,
) {
  if (!supabase) return { localOnly: true as const }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: 'Sign in with a staff account at Admin login.' }
  const staffRole = await fetchStaffRole(auth.user.id)
  if (!staffRole) return { error: 'Not authorized.' }

  const { data, error } = await supabase.rpc('admin_adjust_balance', {
    p_user_id: userId,
    p_account_code: accountCode,
    p_delta: delta,
    p_label: label?.trim() || null,
  })

  if (error) return { error: error.message }
  await pullAccountBalances(userId)
  await import('./remote').then((m) => m.pullTransactionsForUser(userId))
  return { balance: Number(data) }
}

export async function reviewPayment(
  userId: string,
  transactionId: string,
  decision: 'approved' | 'rejected',
  reason?: string,
) {
  if (!supabase) return { localOnly: true as const }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { error: 'Sign in with a staff account at Admin login.' }
  const staffRole = await fetchStaffRole(auth.user.id)
  if (!staffRole) {
    return { error: 'Not authorized. Use Admin login with a staff email (for example info@northrimbankinc.com).' }
  }

  const { data: receipt } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', userId)
    .eq('transaction_id', transactionId)
    .eq('status', 'pending')
    .maybeSingle()

  if (receipt?.id && !transactionId.startsWith('xfer-')) {
    const { error } = await supabase.rpc('review_receipt', {
      p_receipt_id: receipt.id,
      p_decision: decision === 'approved' ? 'approved' : 'rejected',
      p_reason: decision === 'rejected' ? reason?.trim() || null : null,
    })
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.rpc('review_pending_transaction', {
      p_user_id: userId,
      p_transaction_id: transactionId,
      p_decision: decision === 'approved' ? 'approved' : 'rejected',
      p_reason: decision === 'rejected' ? reason?.trim() || null : null,
    })
    if (error) return { error: error.message }
  }

  await pullAccountBalances(userId)
  await import('./remote').then((m) => m.pullTransactionsForUser(userId))
  if (decision === 'approved' && transactionId.startsWith('xfer-') && !transactionId.endsWith('-in')) {
    const { data: incoming } = await supabase
      .from('transactions')
      .select('user_id')
      .eq('id', `${transactionId}-in`)
      .maybeSingle()
    if (incoming?.user_id) {
      await pullAccountBalances(incoming.user_id as string)
      await import('./remote').then((m) => m.pullTransactionsForUser(incoming.user_id as string))
    }
  }
  return { ok: true as const }
}

export async function transferToUser(
  fromAccountCode: string,
  recipientEmail: string,
  amount: number,
  memo: string,
  method?: string,
  payeeDetails?: string,
) {
  const inactive = blockIfInactive()
  if (inactive) return inactive
  if (!supabase) return { localOnly: true as const }
  const { data, error } = await supabase.rpc('transfer_between_users', {
    p_from_account_code: fromAccountCode,
    p_recipient_email: recipientEmail.trim(),
    p_amount: amount,
    p_memo: memo,
    p_method: method?.trim() || null,
    p_payee_details: payeeDetails?.trim() || null,
  })
  if (error) return { error: error.message }
  const { data: auth } = await supabase.auth.getUser()
  if (auth.user?.id) await pullFinancialState(auth.user.id)
  const recipientId = (data as { recipient_id?: string } | null)?.recipient_id
  if (recipientId) {
    await pullAccountBalances(recipientId)
    await import('./remote').then((m) => m.pullTransactionsForUser(recipientId))
  }
  return { data }
}

export async function requestExternalPayment(input: {
  accountCode: string
  payeeName: string
  amount: number
  method: string
  payeeDetails: string
  country: string
  memo?: string
}) {
  const inactive = blockIfInactive()
  if (inactive) return inactive
  if (!supabase) return { localOnly: true as const }
  const { data, error } = await supabase.rpc('request_external_payment', {
    p_from_account_code: input.accountCode,
    p_payee_name: input.payeeName.trim(),
    p_amount: input.amount,
    p_method: input.method,
    p_payee_details: input.payeeDetails,
    p_country: input.country,
    p_memo: input.memo?.trim() || '',
  })
  if (error) return { error: error.message }
  const { data: auth } = await supabase.auth.getUser()
  if (auth.user?.id) await pullFinancialState(auth.user.id)
  return { paymentId: data as string }
}

export async function transferBetweenOwnAccounts(fromCode: string, toCode: string, amount: number, memo: string) {
  const inactive = blockIfInactive()
  if (inactive) return inactive
  if (!supabase) return { localOnly: true as const }
  const { data, error } = await supabase.rpc('transfer_between_own_accounts', {
    p_from_account_code: fromCode,
    p_to_account_code: toCode,
    p_amount: amount,
    p_memo: memo,
  })
  if (error) return { error: error.message }
  const { data: auth } = await supabase.auth.getUser()
  if (auth.user?.id) await pullFinancialState(auth.user.id)
  return { data }
}

export async function requestWithdrawal(input: {
  accountCode: string
  amount: number
  payeeName: string
  method: string
  country: string
}) {
  const inactive = blockIfInactive()
  if (inactive) return inactive
  if (!supabase) return { localOnly: true as const }
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_account_code: input.accountCode,
    p_amount: input.amount,
    p_payee_name: input.payeeName,
    p_method: input.method,
    p_country: input.country,
  })
  if (error) return { error: error.message }
  const { data: auth } = await supabase.auth.getUser()
  if (auth.user?.id) await pullFinancialState(auth.user.id)
  return { requestId: data as string }
}

export async function listWithdrawals(filter: 'pending' | 'all' = 'pending'): Promise<WithdrawalRequest[]> {
  if (!supabase) return []
  let query = supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false })
  if (filter === 'pending') query = query.eq('status', 'pending')
  const { data, error } = await query
  if (error || !data) return []
  return data as WithdrawalRequest[]
}

export async function reviewWithdrawal(requestId: string, decision: 'approved' | 'rejected', reason?: string) {
  if (!supabase) return { localOnly: true as const }
  const { error } = await supabase.rpc('review_withdrawal', {
    p_request_id: requestId,
    p_decision: decision === 'approved' ? 'approved' : 'rejected',
    p_reason: decision === 'rejected' ? reason?.trim() || null : null,
  })
  if (error) return { error: error.message }

  const row = (await supabase.from('withdrawal_requests').select('user_id').eq('id', requestId).maybeSingle()).data
  if (row?.user_id) {
    await pullAccountBalances(row.user_id as string)
    await import('./remote').then((m) => m.pullTransactionsForUser(row.user_id as string))
  }
  await pullAllClientBalances()
  return { ok: true as const }
}

export function mergeRemoteTransactions(userId: string, rows: Transaction[]) {
  localStorage.setItem(ledgerKey(userId), JSON.stringify(sortTransactions(rows)))
  window.dispatchEvent(new Event('ledger-changed'))
}

export function clientNameForId(userId: string) {
  const client = loadClients().find((item) => item.id === userId)
  return client ? `${client.firstName} ${client.lastName}` : userId
}

export async function fetchAvailableBalance(userId: string, accountCode: string) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('available_account_balance', {
    p_user_id: userId,
    p_account_code: accountCode,
  })
  if (error) return null
  return Number(data)
}

export async function assertTransferAmount(userId: string, accountCode: string, amount: number) {
  const available = await fetchAvailableBalance(userId, accountCode)
  if (available === null) return null
  if (amount > available) {
    return { error: 'That is more than the balance still available on this account.' }
  }
  return { ok: true as const }
}
