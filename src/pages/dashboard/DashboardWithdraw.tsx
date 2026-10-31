import { type FormEvent, useEffect, useState } from 'react'
import { useAccount } from '../../auth/useAccount'
import { availableBalance, bankAccounts, formatMoney, primaryAccountId, recordPending } from '../../data/banking'
import {
  emptyMethodFieldValues,
  formatPaymentMethodDetails,
  validatePaymentMethodFields,
} from '../../data/paymentMethodFields'
import { requestWithdrawal } from '../../data/finance'
import { keepMethod } from '../../data/payoutMethods'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { AccountMark } from '../../components/Flags'
import { Field } from '../../components/Field'
import { MethodChoices, methodLabel } from '../../components/MethodChoices'
import { PaymentMethodFields } from '../../components/PaymentMethodFields'
import { IconText } from '../../components/PasswordInput'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { SelectMenu } from '../../components/SelectMenu'
import { type CryptoAssetId } from '../../data/cryptoAssets'

export function DashboardWithdraw() {
  const profile = useAccount()
  const [country, setCountry] = useState(profile?.kyc?.country || 'United Kingdom')
  const [from, setFrom] = useState(primaryAccountId)
  const [payee, setPayee] = useState('')
  const [method, setMethod] = useState(() => keepMethod(country, 'bank'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [methodFields, setMethodFields] = useState(() => emptyMethodFieldValues(method))
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

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
    if (payee.trim().length < 2) {
      setError('Enter the name on the account you are withdrawing to.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    const fieldError = validatePaymentMethodFields(method, methodFields, fieldContext)
    if (fieldError) {
      setError(fieldError)
      return
    }
    if (value > availableBalance(source, profile?.id)) {
      setError('That is more than the balance still available on this account.')
      return
    }
    const methodLine = `${paymentMethodLabel(country, method, methodLabel, coin)} · ${country}`
    const payeeDetails = formatPaymentMethodDetails(method, methodFields, fieldContext)
    const methodRecord = payeeDetails ? `${methodLine} · ${payeeDetails}` : methodLine
    const remote = await requestWithdrawal({
      accountCode: source.id,
      amount: value,
      payeeName: payee.trim(),
      method: methodRecord,
      country,
    })
    if ('error' in remote && remote.error) {
      setError(remote.error)
      return
    }
    if ('localOnly' in remote && remote.localOnly) {
      recordPending({
        accountId: source.id,
        name: `Withdrawal · ${payee.trim()} · ${methodLine}`,
        method: methodRecord,
        amount: -value,
        category: 'Withdrawal',
      })
    }
    setPayee('')
    setAmount('')
    setMethodFields(emptyMethodFieldValues(method, fieldContext))
    setError('')
    setSubmitted(true)
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Withdraw</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          Choose how you want to be paid out, enter the details for that method, and submit. The withdrawal stays pending until North Rim Inc verifies it.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="From">
            <SelectMenu
              value={from}
              onChange={setFrom}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.name,
                hint: formatMoney(availableBalance(account, profile?.id), account.currency),
                icon: <AccountMark id={account.id} currency={account.currency} />,
              }))}
            />
          </Field>
          <Field label="Account name" error={error || undefined}>
            <IconText
              icon="user"
              value={payee}
              placeholder="Name on the receiving account"
              onChange={(event) => setPayee(event.target.value)}
            />
          </Field>
          <Field label="Country">
            <CountrySelect value={country} onChange={setCountry} />
          </Field>
          <MethodChoices country={country} value={method} onChange={setMethod} basis="destination" />
          {method === 'crypto' && (
            <CryptoCurrencySelect value={coin} onChange={setCoin} hint="Choose which cryptocurrency you are withdrawing to." />
          )}
          <PaymentMethodFields methodId={method} context={fieldContext} values={methodFields} onChange={setMethodFields} />
          <Field label={`Amount (${source.currency})`}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Button type="submit">Submit withdrawal</Button>
          {submitted && (
            <p className="text-sm font-medium text-amber-800" role="status">
              Withdrawal pending verification. You will receive a notification once North Rim Inc has processed it.
            </p>
          )}
        </form>
      </div>
      <aside className="rounded-[1.75rem] bg-white p-6">
        <h2 className="font-medium">Available to withdraw</h2>
        <ul className="mt-4 space-y-3">
          {bankAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <AccountMark id={account.id} currency={account.currency} />
                {account.name}
              </span>
              <span className="font-medium tabular-nums">{formatMoney(availableBalance(account, profile?.id), account.currency)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
