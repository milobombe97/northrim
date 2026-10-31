import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../../auth/useAccount'
import { accountBalance, bankAccounts, formatMoney, loadTransactions } from '../../data/banking'

const cardNumber = '4532 1098 2210 4242'
const expiry = '08/29'
const cardSpendCategories = new Set(['Eating out', 'Groceries', 'Shopping', 'Bills', 'Transport'])

export function DashboardCards() {
  const account = useAccount()
  const [frozen, setFrozen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [online, setOnline] = useState(true)
  const [contactless, setContactless] = useState(true)
  const [copied, setCopied] = useState('')

  const holder = account ? `${account.firstName} ${account.lastName}` : 'Cardholder'
  const personal = bankAccounts.find((item) => item.id === 'personal') ?? bankAccounts[0]
  const spends = useMemo(
    () =>
      loadTransactions().filter(
        (item) => item.accountId === 'personal' && item.amount < 0 && cardSpendCategories.has(item.category),
      ),
    [],
  )
  const spent = spends.reduce((total, item) => total + Math.abs(item.amount), 0)

  function copyValue(label: string, value: string) {
    const text = value.trim()
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => undefined)
    }
    setCopied(label)
    window.setTimeout(() => setCopied((current) => (current === label ? '' : current)), 1400)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.04em]">Cards</h1>
          <p className="mt-1 text-sm text-revolut-ink/60">Personal debit card linked to your GBP account.</p>
        </div>
        <p
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            frozen ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {frozen ? 'Frozen' : 'Active'}
        </p>
      </div>

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div>
          <article
            className={`relative flex aspect-[1.586/1] flex-col justify-between overflow-hidden rounded-[1.6rem] bg-revolut-ink p-6 text-white ${
              frozen ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="text-lg font-medium tracking-[-0.03em]">Revolut</p>
              <p className="text-xs tracking-[0.16em] text-white/70">DEBIT</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
              <ContactlessIcon />
            </div>
            <div>
              <p className="font-mono text-xl tracking-[0.16em] sm:text-2xl">
                {showDetails ? cardNumber : '•••• •••• •••• 4242'}
              </p>
              <div className="mt-4 flex items-end justify-between text-xs tracking-[0.08em]">
                <span>{holder.toUpperCase()}</span>
                <span>{showDetails ? expiry : '••/••'}</span>
              </div>
            </div>
            {frozen && (
              <p className="absolute top-1/2 left-6 -translate-y-1/2 rounded-full bg-white px-3 py-1 text-xs font-medium text-revolut-ink">
                Payments paused
              </p>
            )}
          </article>
          <p className="mt-3 text-xs text-revolut-ink/50">North Rim Inc card.</p>
        </div>

        <div className="rounded-[1.75rem] bg-white p-5 sm:p-6">
          <h2 className="font-medium">Card controls</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">
            Linked to {personal.name} · {formatMoney(accountBalance(personal), personal.currency)}
          </p>
          <div className="mt-4 divide-y divide-revolut-line">
            <Control
              label={showDetails ? 'Hide details' : 'Show details'}
              hint="Card number and expiry stay in this browser."
              on={showDetails}
              onClick={() => setShowDetails((value) => !value)}
            />
            <Control
              label={frozen ? 'Unfreeze card' : 'Freeze card'}
              hint={frozen ? 'New payments are paused.' : 'Stop new payments instantly.'}
              on={frozen}
              onClick={() => setFrozen((value) => !value)}
            />
            <Control
              label="Online payments"
              hint="Shops on the web."
              on={online && !frozen}
              disabled={frozen}
              onClick={() => setOnline((value) => !value)}
            />
            <Control
              label="Contactless"
              hint="Tap to pay in person."
              on={contactless && !frozen}
              disabled={frozen}
              onClick={() => setContactless((value) => !value)}
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <CopyChip
              label="Card number"
              value={showDetails ? cardNumber : '•••• •••• •••• 4242'}
              copied={copied === 'number'}
              onClick={() => showDetails && copyValue('number', cardNumber.replaceAll(' ', ''))}
            />
            <CopyChip
              label="Expiry"
              value={showDetails ? expiry : '••/••'}
              copied={copied === 'expiry'}
              onClick={() => showDetails && copyValue('expiry', expiry)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <article className="rounded-[1.75rem] bg-white p-5">
          <p className="text-sm text-revolut-ink/55">Card spend</p>
          <p className="mt-2 text-3xl font-medium tracking-[-0.04em]">{formatMoney(spent, 'GBP')}</p>
          <p className="mt-2 text-sm text-revolut-ink/55">From activity on Personal.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-revolut-ink/70 hover:text-revolut-ink">
            1% cash back offer
          </Link>
        </article>
        <article className="overflow-hidden rounded-[1.75rem] bg-white">
          <h2 className="px-5 pt-5 font-medium">Latest card payments</h2>
          <ul className="mt-2">
            {spends.map((item) => (
              <li key={item.id} className="border-t border-revolut-line first:border-t-0">
                <Link
                  to={`/dashboard/activity/${encodeURIComponent(item.id)}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-revolut-ink/50">
                      {item.category} · {item.date}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatMoney(item.amount, 'GBP')}</p>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

function Control({
  label,
  hint,
  on,
  disabled,
  onClick,
}: {
  label: string
  hint: string
  on: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 py-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-revolut-ink/50">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full ${on ? 'bg-revolut-ink' : 'bg-revolut-line'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function CopyChip({
  label,
  value,
  copied,
  onClick,
}: {
  label: string
  value: string
  copied: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-revolut-muted px-4 py-3 text-left"
    >
      <span className="block text-xs text-revolut-ink/50">{label}</span>
      <span className="mt-1 flex items-center justify-between gap-3">
        <span className="font-medium tabular-nums">{value}</span>
        <span className="text-xs font-medium text-revolut-ink/45">{copied ? 'Copied' : 'Copy'}</span>
      </span>
    </button>
  )
}

function ContactlessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 8.5a6 6 0 0 1 0 7" strokeLinecap="round" />
      <path d="M11.5 6.5a9 9 0 0 1 0 11" strokeLinecap="round" />
      <path d="M15 4.5a12 12 0 0 1 0 15" strokeLinecap="round" />
    </svg>
  )
}
