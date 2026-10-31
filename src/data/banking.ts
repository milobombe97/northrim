import { loadAccount } from '../auth/session'
import { brand } from '../config/brand'
import { supabaseEnabled } from '../lib/supabase'
import { ensureCanTransact } from './adminAccounts'
import { loadPostedBalances } from './balances'
import { sortTransactions } from './transactionsView'
import { receiptFileKey, saveStoredFile } from './fileStore'
import type { StoredFile } from './files'

export type Currency = 'GBP' | 'EUR' | 'USD'

export type AccountField = {
  label: string
  value: string
}

export type BankAccount = {
  id: string
  name: string
  currency: Currency
  balance: number
  detail: string
  fields: AccountField[]
}

export type Transaction = {
  id: string
  accountId: string
  name: string
  category: string
  amount: number
  date: string
  status?: 'pending' | 'approved' | 'declined'
  method?: string
  receiptName?: string
  receiptFile?: StoredFile
  receiptStored?: boolean
  receiptPath?: string
  receiptSent?: boolean
  receiptDismissed?: boolean
}

export const primaryAccountId = 'usd'

export const bankAccounts: BankAccount[] = [
  {
    id: 'usd',
    name: 'US Dollar',
    currency: 'USD',
    balance: 0,
    detail: 'Checking · North Rim Inc',
    fields: [
      { label: 'Bank name', value: 'North Rim Inc' },
      { label: 'Routing number', value: '999999992' },
      { label: 'Account number', value: '009912340001' },
      { label: 'Account type', value: 'Checking' },
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    currency: 'GBP',
    balance: 0,
    detail: 'Sort code 00-99-00',
    fields: [
      { label: 'Bank name', value: 'North Rim Inc' },
      { label: 'Sort code', value: '00-99-00' },
      { label: 'Account number', value: '12345678' },
      { label: 'IBAN', value: 'GB29 REVO 0099 1234 5678 90' },
      { label: 'BIC', value: 'REVODMM1' },
    ],
  },
  {
    id: 'savings',
    name: 'Savings',
    currency: 'GBP',
    balance: 0,
    detail: '4.00% AER variable',
    fields: [
      { label: 'Bank name', value: 'North Rim Inc' },
      { label: 'Sort code', value: '00-99-00' },
      { label: 'Account number', value: '87654321' },
      { label: 'IBAN', value: 'GB29 REVO 0099 8765 4321 01' },
      { label: 'BIC', value: 'REVODMM1' },
    ],
  },
  {
    id: 'euro',
    name: 'Euro',
    currency: 'EUR',
    balance: 0,
    detail: 'EU12 REVO 0099 8765 4321',
    fields: [
      { label: 'Bank name', value: 'North Rim Inc' },
      { label: 'IBAN', value: 'EU12 REVO 0099 8765 4321' },
      { label: 'BIC', value: 'REVODMM1' },
      { label: 'Account number', value: '87654321' },
    ],
  },
]

const LEDGER_KEY = 'revolut-clone-ledger'

export const supportEmail = brand.supportEmail

export function ledgerKey(clientId = loadAccount()?.id || 'primary') {
  return clientId === 'primary' ? LEDGER_KEY : `${LEDGER_KEY}:${clientId}`
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(ledgerKey())
    if (!raw) return []
    return sortTransactions(JSON.parse(raw) as Transaction[])
  } catch {
    return []
  }
}

function extraTransactions(clientId?: string): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(ledgerKey(clientId)) ?? '[]') as Transaction[]
  } catch {
    return []
  }
}

function writeExtra(entries: Transaction[], clientId?: string) {
  const self = loadAccount()
  const activeId = clientId || self?.id
  if (activeId === self?.id && ensureCanTransact(self)) return
  localStorage.setItem(ledgerKey(clientId), JSON.stringify(entries))
  window.dispatchEvent(new Event('ledger-changed'))
  void import('./remote').then((remote) => remote.pushTransactions(clientId, entries))
}

export function loadClientTransactions(clientId: string) {
  return extraTransactions(clientId)
}

function appendTransaction(entry: Transaction) {
  writeExtra([entry, ...extraTransactions()])
  return entry
}

export function recordPending(entry: Omit<Transaction, 'id' | 'date' | 'status' | 'category'> & { category?: string }) {
  return appendTransaction({
    ...entry,
    id: `pending-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    category: entry.category ?? 'Pending',
    status: 'pending',
  })
}

export async function attachReceipt(id: string, receipt: string | StoredFile, clientId?: string, amount?: number) {
  const activeId = clientId || loadAccount()?.id || 'primary'
  const receiptName = typeof receipt === 'string' ? receipt : receipt.name
  let receiptPath: string | undefined
  let uploadError: string | undefined

  if (typeof receipt !== 'string' && receipt.dataUrl) {
    await saveStoredFile(receiptFileKey(activeId, id), receipt)
    const remote = await import('./remote')
    const tx = extraTransactions(activeId).find((t) => t.id === id)
    const txAmount = amount ?? tx?.amount ?? 0
    const account = bankAccounts.find((item) => item.id === tx?.accountId)
    const uploaded = await remote.uploadReceipt(
      activeId,
      id,
      receipt,
      txAmount,
      tx?.accountId,
      account?.currency,
    )
    if (uploaded.error) uploadError = uploaded.error
    receiptPath = uploaded.path
  }

  const hasBytes = typeof receipt !== 'string' && Boolean(receipt.dataUrl)
  writeExtra(
    extraTransactions(activeId).map((item) => {
      if (item.id !== id) return item
      const next: Transaction = {
        ...item,
        receiptName,
        receiptStored: hasBytes || item.receiptStored,
        receiptPath: receiptPath || item.receiptPath,
      }
      if (hasBytes) delete next.receiptFile
      return next
    }),
    activeId,
  )

  if (uploadError) return { error: uploadError }
  return { ok: true as const }
}
export function paymentMethodName(item: Transaction) {
  if (item.method) return item.method
  if (item.name.startsWith('Top up · ')) return item.name.slice('Top up · '.length)
  const parts = item.name.split(' · ')
  return parts.length > 1 ? parts.slice(1).join(' · ') : item.name
}

export function adjustBalance(clientId: string, entry: { accountId: string; name: string; amount: number; category: string }) {
  const item: Transaction = {
    id: `adjust-${Date.now()}`,
    accountId: entry.accountId,
    name: entry.name,
    category: entry.category,
    amount: entry.amount,
    date: new Date().toISOString().slice(0, 10),
  }
  writeExtra([item, ...extraTransactions(clientId)], clientId)
  return item
}

export function approvePending(clientId: string, id: string) {
  writeExtra(
    extraTransactions(clientId).map((item) =>
      item.id === id
        ? { ...item, status: 'approved' as const, category: item.category === 'Pending' ? 'Transfer' : item.category }
        : item,
    ),
    clientId,
  )
}

export function declinePending(clientId: string, id: string) {
  writeExtra(
    extraTransactions(clientId).map((item) => (item.id === id ? { ...item, status: 'declined' as const } : item)),
    clientId,
  )
}

export async function markReceiptSent(id: string, clientId?: string) {
  const activeId = clientId || loadAccount()?.id || 'primary'
  const tx = extraTransactions(activeId).find((item) => item.id === id)
  writeExtra(
    extraTransactions(activeId).map((item) => (item.id === id ? { ...item, receiptSent: true } : item)),
    activeId,
  )
  if (!tx?.receiptPath) return
  const account = bankAccounts.find((item) => item.id === tx.accountId)
  if (supabaseEnabled()) {
    const finance = await import('./finance')
    const result = await finance.submitReceiptRecord({
      accountCode: tx.accountId,
      amount: Math.abs(tx.amount),
      currency: account?.currency || 'USD',
      storagePath: tx.receiptPath,
      fileName: tx.receiptName || 'Receipt',
      transactionId: id,
    })
    if ('error' in result && result.error) {
      console.error('Receipt submission error:', result.error)
    }
  }
}

export function loadDismissedReceiptIds(clientId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`revolut-clone-receipt-dismissed:${clientId}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function dismissReceipt(id: string, clientId?: string) {
  const activeId = clientId || loadAccount()?.id || 'primary'
  const dismissed = loadDismissedReceiptIds(activeId)
  dismissed.add(id)
  localStorage.setItem(`revolut-clone-receipt-dismissed:${activeId}`, JSON.stringify([...dismissed]))
  writeExtra(
    extraTransactions(activeId).map((item) => (item.id === id ? { ...item, receiptDismissed: true } : item)),
    activeId,
  )
}

export function recordPayment(payment: Omit<Transaction, 'id' | 'date' | 'category'>) {
  return appendTransaction({
    ...payment,
    id: `pay-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    category: 'Transfer',
  })
}

export function recordTransfer(transfer: { fromId: string; toId?: string; name: string; amount: number }) {
  const date = new Date().toISOString().slice(0, 10)
  const stamp = Date.now()
  const fromName = bankAccounts.find((account) => account.id === transfer.fromId)?.name ?? 'Account'
  const outgoing: Transaction = {
    id: `xfer-${stamp}`,
    accountId: transfer.fromId,
    name: transfer.name,
    category: 'Transfer',
    amount: -transfer.amount,
    date,
  }
  const entries = [outgoing]
  if (transfer.toId) {
    entries.push({
      id: `xfer-${stamp}-in`,
      accountId: transfer.toId,
      name: `From ${fromName}`,
      category: 'Transfer',
      amount: transfer.amount,
      date,
    })
  }
  writeExtra([...entries, ...extraTransactions()])
  return outgoing
}

export function recordTopUp(topUp: { accountId: string; method: string; amount: number }) {
  return appendTransaction({
    id: `topup-${Date.now()}`,
    accountId: topUp.accountId,
    name: `Top up · ${topUp.method}`,
    category: 'Top up',
    amount: topUp.amount,
    date: new Date().toISOString().slice(0, 10),
  })
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function accountBalance(account: BankAccount, clientId?: string) {
  const posted = loadPostedBalances(clientId)
  if (posted && posted[account.id] !== undefined) {
    return posted[account.id]
  }
  const moved = extraTransactions(clientId)
    .filter((item) => item.accountId === account.id && item.status !== 'pending' && item.status !== 'declined')
    .reduce((sum, item) => sum + item.amount, 0)
  return account.balance + moved
}

export function availableBalance(account: BankAccount, clientId?: string) {
  const id = clientId || loadAccount()?.id
  const posted = loadPostedBalances(id)
  if (supabaseEnabled() && posted && posted[account.id] !== undefined) {
    return posted[account.id]
  }
  const reserved = extraTransactions(id)
    .filter((item) => item.accountId === account.id && item.status === 'pending' && item.amount < 0)
    .reduce((sum, item) => sum + item.amount, 0)
  return accountBalance(account, clientId) + reserved
}

export function gbpTotal() {
  return bankAccounts
    .filter((account) => account.currency === 'GBP')
    .reduce((sum, account) => sum + accountBalance(account), 0)
}
