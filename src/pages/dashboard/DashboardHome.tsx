import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../../auth/useAccount'
import { Button } from '../../components/Button'
import { TransactionRow } from '../../components/TransactionRow'
import { AccountMark } from '../../components/Flags'
import { CountrySelect } from '../../components/CountrySelect'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { FieldIcon, IconText } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import { keepMethod } from '../../data/payoutMethods'
import { DashboardAnalytics } from './DashboardAnalytics'
import {
  accountBalance,
  availableBalance,
  bankAccounts,
  formatMoney,
  loadTransactions,
  primaryAccountId,
  recordPending,
  recordTransfer,
  type Currency,
} from '../../data/banking'
import { filterTransactions } from '../../data/transactionsView'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { type CryptoAssetId } from '../../data/cryptoAssets'
import { transferBetweenOwnAccounts, assertTransferAmount, requestExternalPayment, transferToUser } from '../../data/finance'
import { supabaseEnabled } from '../../lib/supabase'
import {
  emptyMethodFieldValues,
  formatPaymentMethodDetails,
  validatePaymentMethodFields,
} from '../../data/paymentMethodFields'
import { PaymentMethodFields } from '../../components/PaymentMethodFields'
import { isLikelyEmail } from '../../components/SendDestinationKindChoices'

function balanceTextClass(formatted: string, size: 'card' | 'hero' | 'inline' = 'card') {
  const len = formatted.length
  if (size === 'hero') {
    if (len > 16) return 'text-3xl sm:text-4xl'
    if (len > 13) return 'text-4xl sm:text-5xl'
    return 'text-4xl sm:text-5xl'
  }
  if (size === 'inline') {
    if (len > 16) return 'text-sm'
    if (len > 13) return 'text-base'
    return 'text-lg'
  }
  if (len > 16) return 'text-sm'
  if (len > 13) return 'text-base'
  return 'text-lg'
}

function BalanceAmount({
  amount,
  currency,
  size = 'card',
  className = '',
}: {
  amount: number
  currency: Currency
  size?: 'card' | 'hero' | 'inline'
  className?: string
}) {
  const text = formatMoney(amount, currency)
  return (
    <p
      className={`font-medium tabular-nums tracking-tight ${balanceTextClass(text, size)} ${className}`}
      title={text}
    >
      {text}
    </p>
  )
}

export function DashboardHome() {
  const account = useAccount()
  const [query, setQuery] = useState('')
  const [ledgerTick, setLedgerTick] = useState(0)
  const transactions = useMemo(() => loadTransactions(), [ledgerTick])

  useEffect(() => {
    const sync = () => setLedgerTick((tick) => tick + 1)
    window.addEventListener('ledger-changed', sync)
    return () => window.removeEventListener('ledger-changed', sync)
  }, [])

  const usdAccount = bankAccounts.find((item) => item.id === 'usd') ?? bankAccounts[0]
  const usdTotal = accountBalance(usdAccount, account?.id)
  const recent = useMemo(
    () => filterTransactions(loadTransactions(), { query, filter: 'all' }).slice(0, 10),
    [query, ledgerTick],
  )

  return (
    <main className="space-y-6">
      <p className="text-sm text-revolut-ink/55">Good to see you</p>
      <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">
        {account?.firstName}, your accounts
      </h1>

      <CashBackBanner />

      <section className="space-y-4">
        <div className="flex flex-col gap-6 rounded-[1.75rem] bg-revolut-ink p-6 text-white sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-white/60">Total in USD</p>
            <BalanceAmount amount={usdTotal} currency="USD" size="hero" className="mt-2 text-white" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/topup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-revolut-ink"
            >
              <ActionIcon name="add" />
              Add money
            </Link>
            <Link
              to="/dashboard/withdraw"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              <ActionIcon name="withdraw" />
              Withdraw
            </Link>
            <Link
              to="/dashboard/payments"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white"
            >
              <ActionIcon name="send" />
              Send
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {bankAccounts.map((item) => (
            <article key={item.id} className="flex min-h-[7.5rem] flex-col justify-between gap-3 rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <AccountMark id={item.id} currency={item.currency} className="size-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{item.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-revolut-ink/50">{item.detail}</p>
                </div>
              </div>
              <BalanceAmount
                amount={accountBalance(item, account?.id)}
                currency={item.currency}
                className="text-right"
              />
            </article>
          ))}
        </div>
      </section>

      <AccountDetails />

      <QuickTransfer onDone={() => setLedgerTick((tick) => tick + 1)} />

      <DashboardAnalytics transactions={transactions} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-medium tracking-[-0.03em]">Recent activity</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/transactions" className="text-sm font-medium text-revolut-ink/70 hover:text-revolut-ink">
              See all
            </Link>
            <label className="relative block w-full max-w-xs sm:w-64">
            <span className="sr-only">Search transactions</span>
            <FieldIcon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              className="w-full rounded-full border border-revolut-line bg-white py-2 pr-4 pl-11 text-sm outline-none focus:border-revolut-ink"
            />
          </label>
          </div>
        </div>
        <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
          {recent.length === 0 && (
            <li className="px-5 py-8 text-sm text-revolut-ink/55">No transactions match that search.</li>
          )}
          {recent.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </main>
  )
}

const CASHBACK_KEY = 'revolut-clone-cashback-dismissed'

function CashBackBanner() {
  const [open, setOpen] = useState(() => localStorage.getItem(CASHBACK_KEY) !== '1')
  if (!open) return null

  function dismiss() {
    localStorage.setItem(CASHBACK_KEY, '1')
    setOpen(false)
  }

  return (
    <div className="cashback-frame rounded-[1.9rem] p-[2px]">
    <section className="flex flex-col gap-4 rounded-[1.75rem] bg-white px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <p className="grid size-14 shrink-0 place-items-center rounded-2xl bg-revolut-ink text-lg font-medium tracking-[-0.03em] text-white">
          1%
        </p>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.08em] text-revolut-ink/60 uppercase">Cash back</p>
          <h2 className="mt-1 text-2xl font-medium tracking-[-0.03em]">1% back on card spend</h2>
          <p className="mt-1 text-sm text-revolut-ink/70">
            1% back on card spend this month.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/dashboard/cards"
          className="inline-flex items-center justify-center rounded-full bg-revolut-ink px-5 py-2.5 text-sm font-medium text-white"
        >
          View card
        </Link>
        <button
          type="button"
          className="rounded-full px-4 py-2.5 text-sm font-medium text-revolut-ink/70 hover:text-revolut-ink"
          onClick={dismiss}
        >
          Not now
        </button>
      </div>
    </section>
    </div>
  )
}

function AccountDetails() {
  const profile = useAccount()
  const [accountId, setAccountId] = useState(primaryAccountId)
  const [copied, setCopied] = useState('')
  const account = bankAccounts.find((item) => item.id === accountId) ?? bankAccounts[0]
  const balance = accountBalance(account, profile?.id)

  function copyField(label: string, value: string) {
    const text = value.trim()
    const fallback = () => {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(fallback)
    } else {
      fallback()
    }
    setCopied(label)
    window.setTimeout(() => setCopied((current) => (current === label ? '' : current)), 1400)
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-revolut-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-[-0.03em]">Account details</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">North Rim Inc banking details for incoming transfers.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-revolut-ink/45">Posted balance</p>
          <BalanceAmount amount={balance} currency={account.currency} size="inline" className="mt-1" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bankAccounts.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === account.id}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              item.id === account.id ? 'bg-revolut-ink text-white' : 'bg-revolut-muted text-revolut-ink/70 hover:text-revolut-ink'
            }`}
            onClick={() => setAccountId(item.id)}
          >
            <AccountMark id={item.id} currency={item.currency} />
            {item.name}
          </button>
        ))}
      </div>
      <dl className="mt-5 overflow-hidden rounded-2xl border border-revolut-line">
        {account.fields.map((field, index) => (
          <div
            key={field.label}
            className={`grid gap-2 px-4 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)_4.5rem] sm:items-center sm:gap-4 ${
              index > 0 ? 'border-t border-revolut-line' : ''
            }`}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-revolut-ink/45">{field.label}</dt>
            <dd className="min-w-0 break-all font-medium tabular-nums text-sm sm:text-base">{field.value}</dd>
            <dd className="sm:text-right">
              <button
                type="button"
                className="text-xs font-medium text-revolut-ink/55 hover:text-revolut-ink"
                onClick={() => copyField(field.label, field.value)}
              >
                {copied === field.label ? 'Copied' : 'Copy'}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-revolut-ink/45">Tap copy beside any value to paste it into your bank or wallet app.</p>
    </section>
  )
}

function ActionIcon({ name }: { name: 'add' | 'withdraw' | 'send' }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'add' && (
        <>
          <circle cx="10" cy="10" r="6.25" />
          <path d="M10 7.25v5.5M7.25 10h5.5" />
        </>
      )}
      {name === 'withdraw' && (
        <>
          <path d="M10 3.5v7.5" />
          <path d="M7 6.5 10 3.5l3 3" />
          <path d="M4.5 11.5h11v4.5h-11z" />
        </>
      )}
      {name === 'send' && (
        <>
          <path d="M4 10h11.5" />
          <path d="M12 6.5 15.5 10 12 13.5" />
        </>
      )}
    </svg>
  )
}

function QuickTransfer({ onDone }: { onDone: () => void }) {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [fromId, setFromId] = useState(primaryAccountId)
  const [toId, setToId] = useState('external')
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'fps'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [methodFields, setMethodFields] = useState(() => emptyMethodFieldValues(method))
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')

  const source = bankAccounts.find((item) => item.id === fromId) ?? bankAccounts[0]
  const ownAccounts = bankAccounts.filter(
    (item) => item.id !== source.id && item.currency === source.currency,
  )
  const destination =
    toId !== 'external' && toId !== 'nevolute'
      ? ownAccounts.find((item) => item.id === toId) ?? ownAccounts[0]
      : null
  const toNevoluteUser = toId === 'nevolute'
  const toExternalPayee = toId === 'external'

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  const fieldContext = { country, accountCurrency: source.currency }

  useEffect(() => {
    setMethodFields(emptyMethodFieldValues(method, fieldContext))
  }, [method, country, fromId])

  function chooseFrom(nextId: string) {
    const next = bankAccounts.find((item) => item.id === nextId) ?? bankAccounts[0]
    const nextOwn = bankAccounts.filter((item) => item.id !== next.id && item.currency === next.currency)
    setFromId(next.id)
    setToId((current) =>
      current !== 'external' && current !== 'nevolute' && nextOwn.some((item) => item.id === current)
        ? current
        : (nextOwn[0]?.id ?? 'nevolute'),
    )
    setError('')
    setSent('')
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Math.round(Number(amount) * 100) / 100
    const external = toExternalPayee || toNevoluteUser
    const payee = recipient.trim()
    if (toNevoluteUser) {
      if (!isLikelyEmail(payee)) {
        setError('Enter the other customer’s North Rim email.')
        setSent('')
        return
      }
    } else if (external && payee.length < 2) {
      setError('Enter who you are paying.')
      setSent('')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      setSent('')
      return
    }
    if (profile?.id && supabaseEnabled()) {
      const limit = await assertTransferAmount(profile.id, source.id, value)
      if (limit?.error) {
        setError(limit.error)
        setSent('')
        return
      }
    } else {
      const ceiling = external ? availableBalance(source, profile?.id) : accountBalance(source, profile?.id)
      if (value > ceiling) {
        setError('That is more than the balance on this account.')
        setSent('')
        return
      }
    }
    const name = toExternalPayee ? payee : toNevoluteUser ? payee : (destination?.name ?? 'Account')
    const methodText = `${paymentMethodLabel(country, method, methodLabel, coin)} · ${country}`
    const activityName = toExternalPayee ? `${name} · ${methodText}` : toNevoluteUser ? `Transfer to ${payee}` : `To ${name}`
    let payeeDetails = ''
    if (toExternalPayee) {
      const fieldError = validatePaymentMethodFields(method, methodFields, fieldContext)
      if (fieldError) {
        setError(fieldError)
        setSent('')
        return
      }
      payeeDetails = formatPaymentMethodDetails(method, methodFields, fieldContext)
    }
    if (toNevoluteUser && supabaseEnabled()) {
      const activityName = `Transfer to ${payee}`
      const result = await transferToUser(source.id, payee, value, activityName, 'North Rim customer', '')
      if ('error' in result && result.error) {
        setError(result.error)
        setSent('')
        return
      }
      if ('localOnly' in result && result.localOnly) {
        setError('Connect Supabase to send to Another North Rim customer by email.')
        return
      }
      setSent(`${formatMoney(value, source.currency)} to ${payee} — pending approval`)
    } else if (toExternalPayee && supabaseEnabled()) {
      const result = await requestExternalPayment({
        accountCode: source.id,
        payeeName: payee,
        amount: value,
        method: methodText,
        payeeDetails,
        country,
        memo: activityName,
      })
      if ('error' in result && result.error) {
        setError(result.error)
        setSent('')
        return
      }
      setSent(`${formatMoney(value, source.currency)} — pending approval`)
    } else if (toExternalPayee) {
      recordPending({
        accountId: source.id,
        name: activityName,
        method: payeeDetails ? `${methodText} · ${payeeDetails}` : methodText,
        amount: -value,
        category: 'Payment',
      })
      setSent('pending approval')
    } else if (toNevoluteUser) {
      setError('Connect Supabase to send to Another North Rim customer by email.')
      setSent('')
      return
    } else if (!destination) {
      setError('Choose an account to transfer to.')
      setSent('')
      return
    } else {
      const result = await transferBetweenOwnAccounts(source.id, destination.id, value, activityName)
      if ('error' in result && result.error) {
        setError(result.error)
        setSent('')
        return
      }
      if ('localOnly' in result && result.localOnly) {
        recordTransfer({
          fromId: source.id,
          toId: destination.id,
          name: activityName,
          amount: value,
        })
      }
      setSent(`${formatMoney(value, source.currency)} to ${name}`)
    }
    setAmount('')
    setRecipient('')
    setError('')
    onDone()
  }

  return (
    <section className="rounded-[1.75rem] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-medium tracking-[-0.03em]">Quick transfer</h2>
          <p className="mt-1 text-sm text-revolut-ink/55">
            Move money between your accounts, or send it to someone else.
          </p>
        </div>
        <Link to="/dashboard/payments" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">
          Full payment
        </Link>
      </div>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
          <Field label="From">
            <SelectMenu
              value={source.id}
              onChange={chooseFrom}
              options={bankAccounts.map((item) => ({
                value: item.id,
                label: item.name,
                hint: formatMoney(accountBalance(item), item.currency),
                icon: <AccountMark id={item.id} currency={item.currency} />,
              }))}
            />
          </Field>
          <Field label="To">
            <SelectMenu
              value={toNevoluteUser ? 'nevolute' : toExternalPayee ? 'external' : (destination?.id ?? 'nevolute')}
              onChange={(next) => {
                setToId(next)
                setRecipient('')
                setError('')
                setSent('')
              }}
              options={[
                ...ownAccounts.map((item) => ({
                  value: item.id,
                  label: item.name,
                  icon: <AccountMark id={item.id} currency={item.currency} />,
                })),
                { value: 'nevolute', label: 'Another North Rim customer' },
                { value: 'external', label: 'Outside North Rim' },
              ]}
            />
          </Field>
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => {
                setAmount(event.target.value)
                setError('')
              }}
            />
          </Field>
        </div>
        {toNevoluteUser ? (
          <Field label="Their North Rim customer email">
            <IconText
              icon="mail"
              type="email"
              value={recipient}
              placeholder="customer@example.com"
              onChange={(event) => setRecipient(event.target.value)}
            />
          </Field>
        ) : null}
        {toExternalPayee ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Payee name">
                <IconText
                  icon="user"
                  value={recipient}
                  placeholder="Name on the payment"
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </Field>
              <Field label="Country">
                <CountrySelect value={country} onChange={setCountry} />
              </Field>
            </div>
            <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
            {method === 'crypto' && (
              <CryptoCurrencySelect
                value={coin}
                onChange={setCoin}
                hint="Choose which asset you are sending for this transfer."
              />
            )}
            <PaymentMethodFields methodId={method} context={fieldContext} values={methodFields} onChange={setMethodFields} />
          </div>
        ) : null}
        <Button type="submit" className="w-full sm:w-auto">
          Transfer
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {sent && (
        <p className="mt-3 text-sm font-medium text-amber-800" role="status">
          {sent.includes('pending') ? sent : `Sent ${sent}.`}
        </p>
      )}
    </section>
  )
}
