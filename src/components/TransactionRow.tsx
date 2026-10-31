import { Link } from 'react-router-dom'
import { bankAccounts, formatMoney, type Transaction } from '../data/banking'

export function TransactionRow({ item }: { item: Transaction }) {
  const account = bankAccounts.find((entry) => entry.id === item.accountId)
  const currency = account?.currency ?? 'USD'
  const positive = item.amount > 0
  return (
    <li className="border-b border-revolut-line last:border-b-0">
      <Link
        to={`/dashboard/activity/${encodeURIComponent(item.id)}`}
        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-revolut-muted text-revolut-ink">
            <CategoryIcon category={item.category} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-xs text-revolut-ink/50">
              {item.status === 'declined'
                ? `Declined · ${item.date}`
                : item.status === 'approved'
                  ? `Successful · ${item.date}`
                  : item.status === 'pending'
                    ? item.category === 'Withdrawal'
                      ? `Pending verification · ${item.date}`
                      : item.category === 'Transfer' || item.category === 'Payment'
                        ? `Pending approval · ${item.date}`
                        : item.receiptSent
                        ? `Pending · in review · ${item.date}`
                        : item.receiptName
                          ? `Pending · ready to send · ${item.date}`
                          : `Pending · receipt needed · ${item.date}`
                    : `${item.category} · ${item.date}`}
            </p>
          </div>
        </div>
        <p
          className={`shrink-0 font-medium tabular-nums ${item.status === 'declined' ? 'text-red-700' : item.status === 'pending' ? 'text-amber-700' : positive ? 'text-emerald-700' : ''}`}
        >
          {item.status === 'declined' ? 'Declined ' : item.status === 'pending' ? 'Pending ' : positive ? '+' : ''}
          {formatMoney(item.amount, currency)}
        </p>
      </Link>
    </li>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const path =
    category === 'Income' || category === 'Top up'
      ? 'M10 15V5M6 9l4-4 4 4'
      : category === 'Transfer'
        ? 'M4 10h12M12 6l4 4-4 4'
        : category === 'Transport'
          ? 'M5 14V7h10v7M7 14v2M13 14v2M5 10h10'
          : category === 'Bills'
            ? 'M6 4h8v12H6zM8 8h4M8 11h4'
            : category === 'Groceries'
              ? 'M5 7h10l-1 9H6L5 7Zm2-2a3 3 0 0 1 6 0'
              : category === 'Savings'
                ? 'M4 14c2-5 10-5 12 0M10 8V5'
                : 'M6 6h8v8H6z'
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={path} />
    </svg>
  )
}
