import { type FormEvent, useEffect, useState } from 'react'
import { useAccount } from '../../auth/useAccount'
import { accountBalance, availableBalance, bankAccounts, formatMoney, primaryAccountId, recordPending } from '../../data/banking'
import {
  emptyMethodFieldValues,
  formatPaymentMethodDetails,
  validatePaymentMethodFields,
} from '../../data/paymentMethodFields'
import { assertTransferAmount, requestExternalPayment, transferToUser } from '../../data/finance'
import { supabaseEnabled } from '../../lib/supabase'
import { keepMethod } from '../../data/payoutMethods'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { AccountMark } from '../../components/Flags'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { PaymentMethodFields } from '../../components/PaymentMethodFields'
import { SendDestinationKindChoices, isLikelyEmail, type SendDestinationKind } from '../../components/SendDestinationKindChoices'
import { IconText } from '../../components/PasswordInput'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { SelectMenu } from '../../components/SelectMenu'
import { type CryptoAssetId } from '../../data/cryptoAssets'

const pendingNotice =
  'Your payment is pending. It will appear in activity and move money only after North Rim Inc approves it.'

export function DashboardPayments() {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [from, setFrom] = useState(primaryAccountId)
  const [sendKind, setSendKind] = useState<SendDestinationKind>('nevolute')
  const [recipient, setRecipient] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'fps'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [methodFields, setMethodFields] = useState(() => emptyMethodFieldValues(method))
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState('')

  const source = bankAccounts.find((account) => account.id === from) ?? bankAccounts[0]

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  const fieldContext = { country, accountCurrency: source.currency }

  useEffect(() => {
    setMethodFields(emptyMethodFieldValues(method, fieldContext))
  }, [method, country, from])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Math.round(Number(amount) * 100) / 100
    const target = recipient.trim()
    if (sendKind === 'nevolute') {
      if (!isLikelyEmail(target)) {
        setError('Enter the other customer’s North Rim email address.')
        return
      }
    } else if (target.length < 2) {
      setError('Enter who you are paying.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (sendKind === 'external') {
      const fieldError = validatePaymentMethodFields(method, methodFields, fieldContext)
      if (fieldError) {
        setError(fieldError)
        return
      }
    }
    if (profile?.id && supabaseEnabled()) {
      const limit = await assertTransferAmount(profile.id, source.id, value)
      if (limit?.error) {
        setError(limit.error)
        return
      }
    } else if (value > availableBalance(source, profile?.id)) {
      setError('That is more than the balance still available on this account.')
      return
    }
    const label = paymentMethodLabel(country, method, methodLabel, coin)
    const methodLine = `${label} · ${country}`
    const payeeDetails = formatPaymentMethodDetails(method, methodFields, fieldContext)
    const activityName =
      sendKind === 'nevolute' ? `Transfer to ${target}` : `${target} · ${methodLine}`

    if (sendKind === 'nevolute' && supabaseEnabled()) {
      const result = await transferToUser(
        source.id,
        target,
        value,
        activityName,
        'North Rim customer',
        '',
      )
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if ('localOnly' in result && result.localOnly) {
        setSubmitted('')
        setError('Connect Supabase to send money to Another North Rim customer by email.')
        return
      }
      setSubmitted(`Submitted ${formatMoney(value, source.currency)} to ${target}. ${pendingNotice}`)
    } else if (sendKind === 'nevolute') {
      setError('Connect Supabase to send to Another North Rim customer.')
      return
    } else if (supabaseEnabled()) {
      const result = await requestExternalPayment({
        accountCode: source.id,
        payeeName: target,
        amount: value,
        method: methodLine,
        payeeDetails,
        country,
        memo: activityName,
      })
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if ('localOnly' in result && result.localOnly) {
        recordPending({
          accountId: source.id,
          name: activityName,
          method: payeeDetails ? `${methodLine} · ${payeeDetails}` : methodLine,
          amount: -value,
          category: 'Payment',
        })
        setSubmitted(`${pendingNotice}`)
      } else {
        setSubmitted(`Submitted ${formatMoney(value, source.currency)} to ${target}. ${pendingNotice}`)
      }
    } else {
      recordPending({
        accountId: source.id,
        name: activityName,
        method: payeeDetails ? `${methodLine} · ${payeeDetails}` : methodLine,
        amount: -value,
        category: 'Payment',
      })
      setSubmitted(pendingNotice)
    }
    setRecipient('')
    setAmount('')
    setError('')
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Send money</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          Send to Another North Rim customer by email, or pay someone Outside North Rim with your chosen payment method. Every send stays pending until North Rim Inc approves it.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="From">
            <SelectMenu
              value={from}
              onChange={setFrom}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.name,
                hint: formatMoney(accountBalance(account, profile?.id), account.currency),
                icon: <AccountMark id={account.id} currency={account.currency} />,
              }))}
            />
          </Field>
          <SendDestinationKindChoices
            value={sendKind}
            onChange={(next) => {
              setSendKind(next)
              setError('')
              setSubmitted('')
            }}
          />
          <Field
            label={sendKind === 'nevolute' ? 'Their North Rim customer email' : 'Recipient'}
            error={error || undefined}
          >
            <IconText
              icon="mail"
              type={sendKind === 'nevolute' ? 'email' : 'text'}
              value={recipient}
              placeholder={sendKind === 'nevolute' ? 'customer@example.com' : 'Payee name'}
              onChange={(event) => setRecipient(event.target.value)}
            />
          </Field>
          {sendKind === 'external' ? (
            <>
              <Field label="Country">
                <CountrySelect value={country} onChange={setCountry} />
              </Field>
              <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
              {method === 'crypto' && (
                <CryptoCurrencySelect value={coin} onChange={setCoin} hint="Choose which cryptocurrency you are paying with." />
              )}
              <PaymentMethodFields methodId={method} context={fieldContext} values={methodFields} onChange={setMethodFields} />
            </>
          ) : null}
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Button type="submit">Submit payment</Button>
          {submitted ? (
            <p className="text-sm font-medium text-amber-800" role="status">
              {submitted}
            </p>
          ) : null}
        </form>
      </div>
      <aside className="rounded-[1.75rem] bg-white p-6">
        <h2 className="font-medium">Available</h2>
        <ul className="mt-4 space-y-3">
          {bankAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <AccountMark id={account.id} currency={account.currency} />
                {account.name}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(accountBalance(account, profile?.id), account.currency)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
