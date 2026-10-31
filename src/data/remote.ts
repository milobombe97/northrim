import { adoptRemoteAdmin, signOutAdmin, type AdminUser } from '../auth/admins'
import { clearAccount, saveAccount, saveClients, type Account, type KycStatus } from '../auth/session'
import { ledgerKey, loadDismissedReceiptIds, type Transaction } from './banking'
import type { StoredFile } from './files'
import { type KycFileKind, kycFileKey, saveStoredFile } from './fileStore'
import { supabase } from '../lib/supabase'
import { sortTransactions } from './transactionsView'

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase()
}

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  role: 'customer' | 'admin' | 'super'
  status: 'active' | 'suspended' | 'deleted'
  kyc_status: KycStatus
  kyc: Account['kyc']
  settings: Account['settings']
}

type KycSubmissionRow = {
  id: string
  user_id: string
  id_type: string
  id_document_path: string | null
  id_document_back_path: string | null
  selfie_path: string
  proof_of_address_path: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  payload: Account['kyc']
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

type TransactionRow = {
  id: string
  user_id: string
  account_id: string
  name: string
  category: string
  amount: number
  date: string
  status: string | null
  method: string | null
  receipt_name: string | null
  receipt_path: string | null
  receipt_sent: boolean
}

function accountFromProfile(row: ProfileRow, email: string, signedIn: boolean): Account {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || email,
    phone: row.phone,
    password: '',
    signedIn,
    accountStatus: row.status,
    suspended: row.status === 'suspended' || row.status === 'deleted',
    role: row.role === 'customer' ? 'client' : row.role,
    kycStatus: row.kyc_status,
    kyc: row.kyc ?? undefined,
    settings: row.settings ?? undefined,
  }
}

function profilePatch(account: Account) {
  const kyc = account.kyc
  const storedKyc = kyc
    ? {
        ...kyc,
        documentFile: undefined,
        documentBackFile: undefined,
        selfieFile: undefined,
        proofOfAddressFile: undefined,
      }
    : null
  return {
    first_name: account.firstName,
    last_name: account.lastName,
    phone: account.phone,
    email: account.email,
    kyc_status: account.kycStatus,
    kyc: storedKyc,
    settings: account.settings ?? null,
  }
}

export async function signUpWithSupabase(account: Account): Promise<{ error?: string; account?: Account }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { data, error } = await supabase.auth.signUp({
    email: normalizeAuthEmail(account.email),
    password: account.password,
    options: { data: { first_name: account.firstName, last_name: account.lastName } },
  })
  if (error) return { error: error.message }
  if (!data.session || !data.user) {
    return { error: 'Confirm the email in Supabase, or turn off email confirmation, then sign in.' }
  }
  const next = { ...account, id: data.user.id, password: '', signedIn: true, role: 'client' as const }
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: next.email,
    first_name: next.firstName,
    last_name: next.lastName,
    phone: next.phone || '',
    role: 'customer',
    status: 'active',
    kyc_status: next.kycStatus,
  })
  if (profileError) return { error: profileError.message }
  saveAccount(next)
  return { account: next }
}

export async function signInWithSupabase(email: string, password: string): Promise<{ error?: string; account?: Account }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const normalized = normalizeAuthEmail(email)
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password })
  if (error || !data.user) return { error: error?.message ?? 'Sign-in failed.' }
  const row = await loadProfileRow(data.user.id)
  if (!row) return { error: 'No profile was found for this account.' }
  if (row.status === 'deleted') {
    await supabase.auth.signOut()
    return { error: 'This account has been closed.' }
  }
  if (row.status === 'suspended' && row.role === 'customer') {
    await supabase.auth.signOut()
    return { error: 'This account has been suspended. Contact North Rim Inc support.' }
  }
  const profile = accountFromProfile(row, data.user.email ?? normalized, true)
  if (profile.role === 'admin' || profile.role === 'super') {
    adoptRemoteAdmin({
      id: profile.id || data.user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      password: '',
      role: profile.role,
    })
    await pullClients()
    return { account: profile }
  }
  signOutAdmin()
  saveAccount(profile)
  if (profile.id) {
    await pullTransactionsForUser(profile.id)
    await import('./finance').then((finance) => finance.pullAccountBalances(profile.id))
  }
  return { account: profile }
}

/** Admin portal only — never writes a client session when credentials belong to staff. */
export async function signInStaffForAdminPortal(
  email: string,
  password: string,
): Promise<{ error?: string; admin?: AdminUser; account?: Account }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const normalized = normalizeAuthEmail(email)
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalized, password })
  if (error || !data.user) {
    return { error: error?.message ?? 'Sign-in failed.' }
  }

  const row = await loadProfileRow(data.user.id)
  if (!row) {
    await supabase.auth.signOut()
    return { error: 'This login has no profile. Add the person again under Admin → Admins with their email and password.' }
  }
  if (row.status === 'deleted') {
    await supabase.auth.signOut()
    return { error: 'This account has been closed.' }
  }
  if (row.status !== 'active') {
    await supabase.auth.signOut()
    return { error: 'This staff account is not active. Contact your super admin.' }
  }
  if (row.role !== 'admin' && row.role !== 'super') {
    await supabase.auth.signOut()
    signOutAdmin()
    const profile = accountFromProfile(row, data.user.email ?? normalized, false)
    return {
      error: 'This email is a client account. Create a staff login under Admin → Admins (or use a different email).',
      account: profile,
    }
  }

  const profile = accountFromProfile(row, data.user.email ?? normalized, true)
  const staffRole: AdminUser['role'] = row.role === 'super' ? 'super' : 'admin'
  const admin: AdminUser = {
    id: profile.id || data.user.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    password: '',
    role: staffRole,
  }
  adoptRemoteAdmin(admin)
  await pullClients()
  return { admin, account: profile }
}

export async function signInStaff(email: string, password: string): Promise<{ error?: string; admin?: AdminUser }> {
  const result = await signInStaffForAdminPortal(email, password)
  if (result.error || !result.admin) return { error: result.error ?? 'Sign-in failed.' }
  return { admin: result.admin }
}

export async function restoreSupabaseSession() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return
  const profile = await loadProfile(user.id, user.email ?? '', true)
  if (!profile) return
  if (profile.role === 'admin' || profile.role === 'super') {
    adoptRemoteAdmin({
      id: profile.id || user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      password: '',
      role: profile.role,
    })
    await pullClients()
    return
  }
  if (profile.accountStatus === 'suspended' || profile.accountStatus === 'deleted') {
    await supabase.auth.signOut()
    clearAccount()
    signOutAdmin()
    return
  }
  signOutAdmin()
  saveAccount(profile)
  if (profile.id) {
    await pullTransactionsForUser(profile.id)
    await import('./finance').then((finance) => finance.pullAccountBalances(profile.id))
  }
}

async function loadProfileRow(id: string) {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as ProfileRow
}

export async function fetchStaffRole(userId: string): Promise<'admin' | 'super' | null> {
  const row = await loadProfileRow(userId)
  if (!row || row.status !== 'active') return null
  if (row.role === 'admin' || row.role === 'super') return row.role
  return null
}

async function loadProfile(id: string, email: string, signedIn: boolean) {
  const row = await loadProfileRow(id)
  if (!row || row.status === 'deleted') return null
  if (row.status === 'suspended' && row.role === 'customer' && signedIn) return null
  return accountFromProfile(row, email, signedIn)
}

export async function updateOwnPassword(current: string, next: string) {
  if (!supabase) return {}
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) return { error: 'Sign in again before changing the password.' }
  const check = await supabase.auth.signInWithPassword({ email, password: current })
  if (check.error) return { error: 'That does not match your current password.' }
  const { error } = await supabase.auth.updateUser({ password: next })
  return { error: error?.message }
}

export async function pushProfile(account: Account) {
  if (!supabase || !account.id) return
  const { data } = await supabase.auth.getUser()
  if (!data.user) return
  await supabase.from('profiles').update(profilePatch(account)).eq('id', account.id)
}

export async function pushTransactions(clientId: string | undefined, entries: Transaction[]) {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const userId = clientId && clientId !== 'primary' ? clientId : data.user?.id
  if (!userId || !data.user) return
  if (entries.length === 0) {
    await supabase.from('transactions').delete().eq('user_id', userId)
    return
  }
  const rows: TransactionRow[] = entries.map((item) => ({
    id: item.id,
    user_id: userId,
    account_id: item.accountId,
    name: item.name,
    category: item.category,
    amount: item.amount,
    date: item.date,
    status: item.status ?? null,
    method: item.method ?? null,
    receipt_name: item.receiptName ?? null,
    receipt_path: item.receiptPath ?? null,
    receipt_sent: Boolean(item.receiptSent),
  }))
  await supabase.from('transactions').upsert(rows)
  const { data: existing } = await supabase.from('transactions').select('id').eq('user_id', userId)
  const keep = new Set(entries.map((item) => item.id))
  const remove = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id))
  if (remove.length > 0) await supabase.from('transactions').delete().in('id', remove)
}

export async function uploadReceipt(
  clientId: string,
  transactionId: string,
  file: StoredFile,
  amount: number,
  accountCode?: string,
  currency?: string,
): Promise<{ path?: string; error?: string }> {
  if (!supabase || !file.dataUrl) return { error: 'Sign in and try uploading again.' }
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { error: 'Sign in to upload a receipt.' }
  const owner = clientId && clientId !== 'primary' ? clientId : data.user.id
  if (owner !== data.user.id) return { error: 'This receipt must be uploaded from your own account.' }

  const path = `${data.user.id}/${transactionId}`
  const response = await fetch(file.dataUrl)
  const blob = await response.blob()

  const { error: uploadError } = await supabase.storage.from('receipts').upload(path, blob, {
    upsert: true,
    contentType: file.type || blob.type,
  })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { error: uploadError.message }
  }

  const tx = (await import('./banking')).loadClientTransactions(owner).find((item) => item.id === transactionId)
  const finance = await import('./finance')
  const result = await finance.submitReceiptRecord({
    accountCode: accountCode || tx?.accountId || 'personal',
    amount: Math.abs(amount || tx?.amount || 0),
    currency: currency || 'GBP',
    storagePath: path,
    fileName: file.name,
    transactionId,
  })

  if ('error' in result && result.error) {
    console.error('Receipt row insert error:', result.error)
    return { error: result.error }
  }

  return { path }
}

const kycStorageSegment: Record<KycFileKind, string> = {
  front: 'front',
  back: 'back',
  selfie: 'selfie',
  proof: 'proof_of_address',
}

function kycPayloadForDb(kyc: NonNullable<Account['kyc']>) {
  return {
    ...kyc,
    documentFile: undefined,
    documentBackFile: undefined,
    selfieFile: undefined,
    proofOfAddressFile: undefined,
  }
}

export async function storeKycDocuments(clientId: string, kyc: Account['kyc']) {
  if (!kyc) return kyc
  const next = { ...kyc }
  const front = await keepKycSide(clientId, 'front', kyc.documentFile)
  const back = await keepKycSide(clientId, 'back', kyc.documentBackFile)
  const selfie = await keepKycSide(clientId, 'selfie', kyc.selfieFile)
  const proof = await keepKycSide(clientId, 'proof', kyc.proofOfAddressFile)
  if (front.stored) {
    next.documentStored = true
    next.documentPath = front.path || kyc.documentPath
    delete next.documentFile
  }
  if (back.stored) {
    next.documentBackStored = true
    next.documentBackPath = back.path || kyc.documentBackPath
    delete next.documentBackFile
  }
  if (selfie.stored) {
    next.selfieStored = true
    next.selfiePath = selfie.path || kyc.selfiePath
    delete next.selfieFile
  }
  if (proof.stored) {
    next.proofOfAddressStored = true
    next.proofOfAddressPath = proof.path || kyc.proofOfAddressPath
    delete next.proofOfAddressFile
  }
  return next
}

export async function submitKycSubmission(account: Account, kyc: NonNullable<Account['kyc']>) {
  const { ensureCanTransact } = await import('./adminAccounts')
  const blocked = ensureCanTransact(account)
  if (blocked) return { error: blocked }

  const clientId = account.id || 'primary'
  const stored = await storeKycDocuments(clientId, kyc)
  if (!stored) return { error: 'Could not save identity documents.' }

  const selfiePath = stored.selfiePath || `${account.id}/selfie`
  const proofPath = stored.proofOfAddressPath || `${account.id}/proof_of_address`

  if (!supabase || !account.id) {
    return { kyc: { ...stored, submissionId: stored.submissionId } }
  }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || auth.user.id !== account.id) {
    return { error: 'Sign in again before submitting identity documents.' }
  }

  if (!stored.documentPath || !stored.selfiePath || !stored.proofOfAddressPath) {
    return { error: 'Upload your ID, a selfie, and proof of address before submitting.' }
  }

  const { data: row, error } = await supabase
    .from('kyc_submissions')
    .insert({
      user_id: account.id,
      id_type: stored.documentType,
      id_document_path: stored.documentPath,
      id_document_back_path: stored.documentBackPath ?? null,
      selfie_path: stored.selfiePath || selfiePath,
      proof_of_address_path: stored.proofOfAddressPath || proofPath,
      status: 'pending',
      payload: kycPayloadForDb(stored),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const nextKyc = { ...stored, submissionId: row?.id, rejectionReason: undefined }
  const nextAccount: Account = { ...account, kyc: nextKyc, kycStatus: 'in_review' }
  await supabase.from('profiles').update(profilePatch(nextAccount)).eq('id', account.id)

  return { kyc: nextKyc, account: nextAccount }
}

export async function fetchLatestKycSubmission(userId: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as KycSubmissionRow
}

export async function reviewKycSubmission(
  userId: string,
  decision: 'approved' | 'rejected',
  reason?: string,
) {
  const submission = await fetchLatestKycSubmission(userId)
  if (!supabase) {
    return { error: 'Supabase is not configured.' }
  }
  if (!submission || submission.status !== 'pending') {
    return { error: 'No pending identity check was found for this client.' }
  }

  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('kyc_submissions')
    .update({
      status: decision,
      rejection_reason: decision === 'rejected' ? reason?.trim() || null : null,
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id)

  if (error) return { error: error.message }

  await pullClients()
  const current = loadAccountFromPull(userId)
  return { account: current }
}

function loadAccountFromPull(userId: string): Account | undefined {
  try {
    const raw = localStorage.getItem('revolut-clone-clients')
    const clients = raw ? (JSON.parse(raw) as Account[]) : []
    return clients.find((item) => item.id === userId)
  } catch {
    return undefined
  }
}

async function keepKycSide(clientId: string, side: KycFileKind, file?: StoredFile) {
  if (!file?.dataUrl) return { stored: false as const }
  await saveStoredFile(kycFileKey(clientId, side), file)
  const path = await uploadKyc(clientId, side, file)
  return { stored: true as const, path }
}

async function uploadKyc(clientId: string, side: KycFileKind, file: StoredFile) {
  if (!supabase || !file.dataUrl) return undefined
  const { data } = await supabase.auth.getUser()
  if (!data.user) return undefined
  const owner = clientId && clientId !== 'primary' ? clientId : data.user.id
  if (owner !== data.user.id) return undefined
  const segment = kycStorageSegment[side]
  const path = `${data.user.id}/${segment}`
  const response = await fetch(file.dataUrl)
  const blob = await response.blob()
  const { error } = await supabase.storage.from('kyc').upload(path, blob, {
    upsert: true,
    contentType: file.type || blob.type,
  })
  return error ? undefined : path
}

export async function kycPreview(path: string, name: string, type: string) {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from('kyc').createSignedUrl(path, 6030)
  if (error || !data?.signedUrl) return null
  const file: StoredFile = { name, type: type || 'image/jpeg', dataUrl: data.signedUrl }
  return file
}

export async function receiptPreview(path: string, name: string, type: string) {
  if (!supabase) return null
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 6030)
  if (error || !data?.signedUrl) return null
  const file: StoredFile = { name, type: type || 'image/jpeg', dataUrl: data.signedUrl }
  return file
}

function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    status: row.status === 'pending' || row.status === 'approved' || row.status === 'declined' ? row.status : undefined,
    method: row.method ?? undefined,
    receiptName: row.receipt_name ?? undefined,
    receiptPath: row.receipt_path ?? undefined,
    receiptStored: Boolean(row.receipt_path),
    receiptSent: row.receipt_sent,
  }
}

export async function pullTransactionsForUser(userId: string) {
  if (!supabase) return
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error || !data) return
  const entries = sortTransactions((data as TransactionRow[]).map(transactionFromRow))
  const dismissed = loadDismissedReceiptIds(userId)
  const merged = entries.map((entry) =>
    dismissed.has(entry.id) ? { ...entry, receiptDismissed: true } : entry,
  )
  localStorage.setItem(ledgerKey(userId), JSON.stringify(merged))
  window.dispatchEvent(new Event('ledger-changed'))
}

async function pullAllLedgers() {
  if (!supabase) return
  const { data, error } = await supabase.from('transactions').select('*')
  if (error || !data) return
  const groups = new Map<string, Transaction[]>()
  for (const row of data as TransactionRow[]) {
    const list = groups.get(row.user_id) ?? []
    list.push(transactionFromRow(row))
    groups.set(row.user_id, list)
  }
  for (const [id, entries] of groups) {
    localStorage.setItem(ledgerKey(id), JSON.stringify(entries))
  }
  window.dispatchEvent(new Event('ledger-changed'))
}

async function pullClients() {
  if (!supabase) return
  const { data, error } = await supabase.from('profiles').select('*').in('role', ['customer', 'client'])
  if (error || !data) return
  const accounts = (data as ProfileRow[]).map((row) => accountFromProfile(row, row.email, false))
  saveClients(accounts)
  await pullAllLedgers()
  await import('./finance').then((finance) => finance.pullAllClientBalances())
}

export async function refreshClientsFromRemote() {
  await pullClients()
}

function staffFunctionUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return null
  return `${url.replace(/\/$/, '')}/functions/v1/admin-staff`
}

async function staffFunctionRequest(body: Record<string, unknown>): Promise<{ error?: string; admin?: AdminUser }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const endpoint = staffFunctionUrl()
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!endpoint || !anon) return { error: 'Supabase is not configured.' }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return { error: 'Sign in again as super admin, then add the staff member.' }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    admin?: { id: string; email: string; firstName: string; lastName: string; role: 'admin' | 'super' }
  }

  if (!response.ok) return { error: payload.error ?? 'Could not update staff.' }

  if (payload.admin) {
    const admin: AdminUser = {
      id: payload.admin.id,
      email: payload.admin.email,
      firstName: payload.admin.firstName,
      lastName: payload.admin.lastName,
      password: '',
      role: payload.admin.role === 'super' ? 'super' : 'admin',
    }
    return { admin }
  }

  return {}
}

export async function listStaffFromRemote(): Promise<{ error?: string; admins?: AdminUser[] }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .in('role', ['admin', 'super'])
    .eq('status', 'active')
    .order('role', { ascending: true })

  if (error) return { error: error.message }

  const admins: AdminUser[] = (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    password: '',
    role: row.role === 'super' ? 'super' : 'admin',
  }))

  return { admins }
}

export async function createStaffOnRemote(entry: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<{ error?: string; admin?: AdminUser }> {
  return staffFunctionRequest({
    action: 'create',
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: normalizeAuthEmail(entry.email),
    password: entry.password,
  })
}

export async function updateStaffOnRemote(
  userId: string,
  patch: { firstName?: string; lastName?: string; email?: string; password?: string },
): Promise<{ error?: string }> {
  const result = await staffFunctionRequest({
    action: 'update',
    userId,
    ...patch,
  })
  return { error: result.error }
}