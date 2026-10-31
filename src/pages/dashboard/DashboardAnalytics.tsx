import { useMemo, useState } from 'react'
import { CurrencyFlag } from '../../components/Flags'
import { accountBalance, bankAccounts, formatMoney, type Currency, type Transaction } from '../../data/banking'

export function DashboardAnalytics({ transactions }: { transactions: Transaction[] }) {
  const [currency, setCurrency] = useState<Currency>('USD')

  const view = useMemo(() => buildView(transactions, currency), [transactions, currency])

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium tracking-[-0.03em]">Analytics</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">From this account's activity.</p>
        </div>
        <div className="flex rounded-full bg-white p-1">
          {(['GBP', 'EUR', 'USD'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={currency === item}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                currency === item ? 'bg-revolut-ink text-white' : 'text-revolut-ink/60'
              }`}
              onClick={() => setCurrency(item)}
            >
              <CurrencyFlag currency={item} />
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Money in" value={formatMoney(view.moneyIn, currency)} tone="in" />
        <Stat label="Money out" value={formatMoney(view.moneyOut, currency)} />
        <Stat
          label="Net"
          value={`${view.net >= 0 ? '+' : ''}${formatMoney(view.net, currency)}`}
          tone={view.net >= 0 ? 'in' : 'out'}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-[1.5rem] bg-white p-5">
          <h3 className="font-medium">Spending by category</h3>
          {view.categories.length === 0 ? (
            <p className="mt-6 text-sm text-revolut-ink/55">No spending in {currency} yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {view.categories.map((item) => (
                <li key={item.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{item.name}</span>
                    <span className="tabular-nums text-revolut-ink/70">
                      {formatMoney(item.amount, currency)} · {item.share}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-revolut-muted">
                    <div
                      className="h-full rounded-full bg-revolut-ink"
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-[1.5rem] bg-white p-5">
          <h3 className="font-medium">Daily flow</h3>
          {view.days.length === 0 ? (
            <p className="mt-6 text-sm text-revolut-ink/55">No {currency} activity yet.</p>
          ) : (
            <>
              <div className="mt-5 flex h-36 items-end gap-2">
                {view.days.map((day) => (
                  <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                    <div className="flex h-full items-end gap-1">
                      <Bar height={day.inShare} className="bg-emerald-600" label={`${day.label} in ${formatMoney(day.moneyIn, currency)}`} />
                      <Bar height={day.outShare} className="bg-revolut-ink" label={`${day.label} out ${formatMoney(day.moneyOut, currency)}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {view.days.map((day) => (
                  <p key={day.date} className="min-w-0 flex-1 truncate text-center text-[10px] text-revolut-ink/45">
                    {day.label}
                  </p>
                ))}
              </div>
              <p className="mt-4 flex gap-4 text-xs text-revolut-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-600" /> In
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-revolut-ink" /> Out
                </span>
              </p>
            </>
          )}
        </article>
      </div>

      <article className="mt-3 rounded-[1.5rem] bg-white p-5">
        <h3 className="font-medium">Balance split</h3>
        {view.accounts.length === 0 ? (
          <p className="mt-4 text-sm text-revolut-ink/55">No {currency} accounts.</p>
        ) : (
          <>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-revolut-muted">
              {view.accounts.map((item, index) => (
                <div
                  key={item.id}
                  className={index === 0 ? 'bg-revolut-ink' : 'bg-revolut-ink/35'}
                  style={{ width: `${item.share}%` }}
                  title={`${item.name} ${formatMoney(item.balance, currency)}`}
                />
              ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {view.accounts.map((item, index) => (
                <li key={item.id} className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${index === 0 ? 'bg-revolut-ink' : 'bg-revolut-ink/35'}`} />
                  <span>{item.name}</span>
                  <span className="tabular-nums text-revolut-ink/60">
                    {formatMoney(item.balance, currency)} · {item.share}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>
    </section>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'in' | 'out' }) {
  const color = tone === 'in' ? 'text-emerald-700' : tone === 'out' ? 'text-revolut-ink' : 'text-revolut-ink'
  return (
    <article className="rounded-[1.5rem] bg-white px-5 py-4">
      <p className="text-sm text-revolut-ink/55">{label}</p>
      <p className={`mt-1 text-2xl font-medium tracking-[-0.03em] tabular-nums ${color}`}>{value}</p>
    </article>
  )
}

function Bar({ height, className, label }: { height: number; className: string; label: string }) {
  return (
    <div className="flex h-full flex-1 items-end" title={label}>
      <div
        className={`w-full rounded-t-md ${className}`}
        style={{ height: `${Math.max(height, height > 0 ? 6 : 0)}%` }}
      />
    </div>
  )
}

function buildView(transactions: Transaction[], currency: Currency) {
  const matching = transactions.filter(
    (item) => item.status !== 'pending' && item.status !== 'declined' && accountCurrency(item.accountId) === currency,
  )
  const moneyIn = sum(matching.filter((item) => item.amount > 0))
  const moneyOut = Math.abs(sum(matching.filter((item) => item.amount < 0)))
  const categories = groupSpending(matching, moneyOut)
  const days = groupDays(matching)
  const accounts = bankAccounts
    .filter((account) => account.currency === currency)
    .map((account) => ({
      id: account.id,
      name: account.name,
      balance: Math.max(accountBalance(account), 0),
    }))
  const balanceTotal = accounts.reduce((total, account) => total + account.balance, 0)

  return {
    moneyIn,
    moneyOut,
    net: moneyIn - moneyOut,
    categories,
    days,
    accounts: accounts.map((account) => ({
      ...account,
      share: balanceTotal > 0 ? Math.round((account.balance / balanceTotal) * 100) : 0,
    })),
  }
}

function accountCurrency(accountId: string): Currency {
  return bankAccounts.find((account) => account.id === accountId)?.currency ?? 'GBP'
}

function sum(items: Transaction[]) {
  return items.reduce((total, item) => total + item.amount, 0)
}

function groupSpending(transactions: Transaction[], moneyOut: number) {
  const totals = new Map<string, number>()
  for (const item of transactions) {
    if (item.amount >= 0) continue
    totals.set(item.category, (totals.get(item.category) ?? 0) + Math.abs(item.amount))
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      share: moneyOut > 0 ? Math.round((amount / moneyOut) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

function groupDays(transactions: Transaction[]) {
  const byDate = new Map<string, { moneyIn: number; moneyOut: number }>()
  for (const item of transactions) {
    const current = byDate.get(item.date) ?? { moneyIn: 0, moneyOut: 0 }
    if (item.amount >= 0) current.moneyIn += item.amount
    else current.moneyOut += Math.abs(item.amount)
    byDate.set(item.date, current)
  }
  const days = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))
  const peak = Math.max(...days.map((day) => Math.max(day.moneyIn, day.moneyOut)), 0)
  return days.map((day) => ({
    ...day,
    label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${day.date}T00:00:00`)),
    inShare: peak > 0 ? (day.moneyIn / peak) * 100 : 0,
    outShare: peak > 0 ? (day.moneyOut / peak) * 100 : 0,
  }))
}
