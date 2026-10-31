import { type FormEvent, useEffect, useState } from 'react'
import { useAccount } from '../../auth/useAccount'
import { accountBalance, bankAccounts, formatMoney, primaryAccountId, recordPending } from '../../data/banking'
import { keepMethod, methodsForCountry, residenceCountry } from '../../data/payoutMethods'
import { Button } from '../../components/Button'
import { AccountMark } from '../../components/Flags'
import { MethodChoices } from '../../components/MethodChoices'
import { Field } from '../../components/Field'
import { IconText } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import { CryptoCurrencySelect, paymentMethodLabel } from '../../components/CryptoCurrencySelect'
import { type CryptoAssetId } from '../../data/cryptoAssets'

const maxAmount = 10_000

export function DashboardTopUp() {
  const profile = useAccount()
  const country = residenceCountry(profile?.kyc?.country)
  const [accountId, setAccountId] = useState(primaryAccountId)
  const [method, setMethod] = useState(() => keepMethod(country, 'bank'))
  const [coin, setCoin] = useState<CryptoAssetId>('BTC')
  const [payer, setPayer] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const account = bankAccounts.find((item) => item.id === accountId) ?? bankAccounts[0]
  const methods = methodsForCountry(country)

  useEffect(() => {
    setMethod((current) => keepMethod(country, current))
  }, [country])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Math.round(Number(amount) * 100) / 100
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (value > maxAmount) {
      setError(`Top-ups are limited to ${formatMoney(maxAmount, account.currency)}.`)
      return
    }
    const methodLabelText = paymentMethodLabel(country, method, (_country, m) => {
      const picked = methods.find((item) => item.id === m) ?? methods[0]
      return m === 'bank' ? 'Bank transfer' : picked.label
    }, coin)
    const from = payer.trim()
    const label = from && (method === 'zelle' || method === 'chime' || method === 'etransfer' || method === 'interac') ? `${methodLabelText} · ${from}` : methodLabelText
    recordPending({
      accountId: account.id,
      name: `Top up · ${label}`,
      method: label,
      amount: value,
      category: 'Top up',
    })
    setAmount('')
    setPayer('')
    setError('')
  }

  return (
    <main className="grid gap-8 lg:grid-cols-[minmax(0,460px)_1fr]">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Add money</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          Add money to a North Rim Inc account with a method available where you live. The request
          stays pending until support approves a receipt.
        </p>
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <Field label="Account">
            <SelectMenu
              value={accountId}
              onChange={setAccountId}
              options={bankAccounts.map((item) => ({
                value: item.id,
                label: item.name,
                hint: formatMoney(accountBalance(item), item.currency),
                icon: <AccountMark id={item.id} currency={item.currency} />,
              }))}
            />
          </Field>

          <MethodChoices country={country} value={method} onChange={setMethod} />

          {method === 'crypto' && (
            <CryptoCurrencySelect
              value={coin}
              onChange={setCoin}
              hint="Choose the asset you sent. The credited amount stays in your account currency."
            />
          )}

          {(method === 'zelle' || method === 'chime' || method === 'etransfer' || method === 'interac') && (
            <Field label="Name on the payment" hint="Optional. Shown on the activity line.">
              <IconText
                icon="user"
                value={payer}
                placeholder="Your name"
                onChange={(event) => setPayer(event.target.value)}
              />
            </Field>
          )}

          {method === 'bank' && (
            <div className="rounded-2xl bg-white px-4 py-4 text-sm">
              <p className="font-medium">North Rim Inc details for {account.name}</p>
              <p className="mt-1 text-revolut-ink/70">{account.detail}</p>
              <p className="mt-2 text-xs text-revolut-ink/50">
                Confirming records a pending request. The balance changes only after support approves the receipt.
              </p>
            </div>
          )}

          <Field label={`Amount (${account.currency})`} error={error || undefined}>
            <IconText
              icon="banknote"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Button type="submit">{method === 'apple' ? 'Confirm with Apple Pay' : 'Add money'}</Button>
        </form>
      </div>
      <aside className="rounded-[1.75rem] bg-white p-6">
        <h2 className="font-medium">Balances</h2>
        <ul className="mt-4 space-y-3">
          {bankAccounts.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <AccountMark id={item.id} currency={item.currency} />
                {item.name}
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(accountBalance(item), item.currency)}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
