import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldIcon } from '../../components/PasswordInput'
import { TransactionRow } from '../../components/TransactionRow'
import { loadTransactions } from '../../data/banking'
import {
  filterTransactions,
  transactionFilterLabels,
  type TransactionFilter,
} from '../../data/transactionsView'

const filters: TransactionFilter[] = ['all', 'completed', 'cancelled', 'top_up', 'withdrawals', 'incoming']

export function DashboardTransactions() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [ledgerTick, setLedgerTick] = useState(0)

  useEffect(() => {
    const sync = () => setLedgerTick((tick) => tick + 1)
    window.addEventListener('ledger-changed', sync)
    return () => window.removeEventListener('ledger-changed', sync)
  }, [])

  const visible = useMemo(
    () => filterTransactions(loadTransactions(), { query, filter }),
    [query, filter, ledgerTick],
  )

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Transactions</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">Search and filter everything on your accounts.</p>
      </div>

      <label className="relative block w-full max-w-md">
        <span className="sr-only">Search transactions</span>
        <FieldIcon name="search" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, amount, or date"
          className="w-full rounded-full border border-revolut-line bg-white py-2.5 pr-4 pl-11 text-sm outline-none focus:border-revolut-ink"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {filters.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === key ? 'bg-revolut-ink text-white' : 'bg-white text-revolut-ink/70 ring-1 ring-revolut-line hover:text-revolut-ink'
            }`}
          >
            {transactionFilterLabels[key]}
          </button>
        ))}
      </div>

      <ul className="overflow-hidden rounded-[1.5rem] bg-white">
        {visible.length === 0 ? (
          <li className="px-5 py-10 text-center text-sm text-revolut-ink/55">
            No transactions match.{' '}
            {filter !== 'all' || query ? (
              <button type="button" className="font-medium text-revolut-ink underline-offset-2 hover:underline" onClick={() => { setFilter('all'); setQuery('') }}>
                Clear filters
              </button>
            ) : (
              <Link to="/dashboard/topup" className="font-medium text-revolut-ink underline-offset-2 hover:underline">
                Add money
              </Link>
            )}
          </li>
        ) : (
          visible.map((item) => <TransactionRow key={item.id} item={item} />)
        )}
      </ul>
    </main>
  )
}
