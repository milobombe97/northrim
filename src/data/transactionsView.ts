import type { Transaction } from './banking'

export type TransactionFilter =
  | 'all'
  | 'completed'
  | 'cancelled'
  | 'top_up'
  | 'withdrawals'
  | 'incoming'

export const transactionFilterLabels: Record<TransactionFilter, string> = {
  all: 'All',
  completed: 'Completed',
  cancelled: 'Cancelled',
  top_up: 'Top up',
  withdrawals: 'Withdrawals',
  incoming: 'Incoming',
}

export function sortTransactions(entries: Transaction[]): Transaction[] {
  return [...entries].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return b.id.localeCompare(a.id)
  })
}

export function matchesTransactionFilter(item: Transaction, filter: TransactionFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'completed') {
    return item.status === 'approved' || (item.status !== 'pending' && item.status !== 'declined')
  }
  if (filter === 'cancelled') return item.status === 'declined'
  if (filter === 'top_up') return item.category === 'Top up'
  if (filter === 'withdrawals') return item.category === 'Withdrawal'
  if (filter === 'incoming') return item.amount > 0
  return true
}

export function matchesTransactionSearch(item: Transaction, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [item.name, item.category, item.method ?? '', item.date, String(item.amount)].join(' ').toLowerCase()
  return haystack.includes(q)
}

export function filterTransactions(
  entries: Transaction[],
  options: { query?: string; filter?: TransactionFilter },
): Transaction[] {
  const sorted = sortTransactions(entries)
  const filter = options.filter ?? 'all'
  const query = options.query ?? ''
  return sorted.filter((item) => matchesTransactionFilter(item, filter) && matchesTransactionSearch(item, query))
}
