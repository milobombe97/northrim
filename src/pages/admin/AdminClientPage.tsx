import { type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadClients, updateClient, type Account } from '../../auth/session'
import { Button } from '../../components/Button'
import { AccountMark } from '../../components/Flags'
import { CountrySelect } from '../../components/CountrySelect'
import { Field, TextInput } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import {
  accountBalance,
  adjustBalance,
  approvePending,
  bankAccounts,
  declinePending,
  formatMoney,
  loadClientTransactions,
} from '../../data/banking'
import { accountStatusOf, setProfileStatus, type AccountStatus } from '../../data/adminAccounts'
import { supabaseEnabled } from '../../lib/supabase'

export function AdminClientPage() {
  const { id = '' } = useParams()
  const [tick, setTick] = useState(0)
  const client = loadClients().find((item) => item.id === id)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('clients-changed', sync)
    window.addEventListener('account-changed', sync)
    window.addEventListener('ledger-changed', sync)
    return () => {
      window.removeEventListener('clients-changed', sync)
      window.removeEventListener('account-changed', sync)
      window.removeEventListener('ledger-changed', sync)
    }
  }, [])

  void tick

  if (!client) {
    return (
      <main>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Client not found</h1>
        <Link to="/admin" className="mt-4 inline-block text-sm font-medium hover:underline">Clients</Link>
      </main>
    )
  }

  return <ClientEditor key={client.id} client={client} />
}

function ClientEditor({ client }: { client: Account }) {
  const [firstName, setFirstName] = useState(client.firstName)
  const [lastName, setLastName] = useState(client.lastName)
  const [email, setEmail] = useState(client.email)
  const [phone, setPhone] = useState(client.phone)
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState(client.kyc?.addressLine ?? '')
  const [city, setCity] = useState(client.kyc?.city ?? '')
  const [postcode, setPostcode] = useState(client.kyc?.postcode ?? '')
  const [country, setCountry] = useState(client.kyc?.country ?? '')
  const [saved, setSaved] = useState('')
  const [detailError, setDetailError] = useState('')
  const [accountId, setAccountId] = useState('usd')
  const [amount, setAmount] = useState('')
  const [moneyError, setMoneyError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const pending = loadClientTransactions(client.id || 'primary').filter((item) => item.status === 'pending')
  const approved = client.kycStatus === 'verified'
  const status = accountStatusOf(client)

  useEffect(() => {
    if (!client.id || !supabaseEnabled()) return
    void import('../../data/finance').then((finance) => finance.pullAccountBalances(client.id))
  }, [client.id])

  async function changeStatus(next: AccountStatus) {
    if (!client.id) return
    setStatusError('')
    setStatusBusy(true)
    const result = await setProfileStatus(client.id, next)
    setStatusBusy(false)
    if (result.error) {
      setStatusError(result.error)
      return
    }
  }

  function saveDetails(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    if (password && password.length < 8) {
      setDetailError('Use at least 8 characters for the new password.')
      setSaved('')
      return
    }
    if (loadClients().some((item) => item.id !== client.id && item.email.toLowerCase() === nextEmail.toLowerCase())) {
      setDetailError('Another client already uses that email.')
      setSaved('')
      return
    }
    updateClient({
      ...client,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: nextEmail,
      phone: phone.trim(),
      password: password || client.password,
      kyc: client.kyc
        ? { ...client.kyc, addressLine: address.trim(), city: city.trim(), postcode: postcode.trim(), country }
        : client.kyc,
    })
    setPassword('')
    setDetailError('')
    setSaved(password ? 'Client details and password saved.' : 'Client details saved.')
  }

  async function moveMoney(direction: 'fund' | 'defund') {
    const value = Number(amount)
    const bank = bankAccounts.find((item) => item.id === accountId) ?? bankAccounts[0]
    if (!Number.isFinite(value) || value <= 0) {
      setMoneyError('Enter an amount greater than zero.')
      return
    }
    const signed = direction === 'defund' ? -value : value
    if (signed < 0 && accountBalance(bank, client.id) + signed < 0) {
      setMoneyError('That amount is higher than the posted balance.')
      return
    }
    const label =
      direction === 'fund' ? 'Funds added by North Rim Inc' : 'Funds removed by North Rim Inc'

    if (supabaseEnabled() && client.id) {
      const finance = await import('../../data/finance')
      const result = await finance.adminAdjustBalance(client.id, bank.id, signed, label)
      if (result.error) {
        setMoneyError(result.error)
        return
      }
      if (result.localOnly) {
        adjustBalance(client.id, {
          accountId: bank.id,
          name: label,
          amount: signed,
          category: direction === 'fund' ? 'Top up' : 'Withdrawal',
        })
      }
    } else {
      adjustBalance(client.id || 'primary', {
        accountId: bank.id,
        name: label,
        amount: signed,
        category: direction === 'fund' ? 'Top up' : 'Withdrawal',
      })
    }

    setAmount('')
    setMoneyError('')
  }

  return (
    <main className="max-w-5xl space-y-6">
      <Link to="/admin" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">Clients</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.04em]">{client.firstName} {client.lastName}</h1>
          <p className="mt-1 text-sm text-revolut-ink/55">{client.email}</p>
          <p className="mt-1 text-sm capitalize text-revolut-ink/60">Account: {status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== 'suspended' && status !== 'deleted' && (
            <Button type="button" variant="secondary" disabled={statusBusy} onClick={() => void changeStatus('suspended')}>
              Suspend
            </Button>
          )}
          {status === 'suspended' && (
            <Button type="button" disabled={statusBusy} onClick={() => void changeStatus('active')}>
              Reactivate
            </Button>
          )}
          {status !== 'deleted' && (
            <Button type="button" variant="secondary" disabled={statusBusy} onClick={() => void changeStatus('deleted')}>
              Soft delete
            </Button>
          )}
        </div>
      </div>
      {statusError ? <p className="text-sm text-red-600">{statusError}</p> : null}

      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="text-lg font-medium">Details</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={saveDetails}>
          <Field label="First name"><IconText icon="user" required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></Field>
          <Field label="Last name"><IconText icon="user" required value={lastName} onChange={(event) => setLastName(event.target.value)} /></Field>
          <Field label="Email"><IconText icon="mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Phone"><IconText icon="phone" required value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
          <Field label="New password" hint="Leave blank to keep the current password." error={detailError || undefined}>
            <PasswordInput autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setDetailError('') }} />
          </Field>
          {client.kyc && (
            <>
              <Field label="Address"><IconText icon="home" value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
              <Field label="City"><IconText icon="pin" value={city} onChange={(event) => setCity(event.target.value)} /></Field>
              <Field label="Postcode"><IconText icon="hash" value={postcode} onChange={(event) => setPostcode(event.target.value)} /></Field>
              <Field label="Country"><CountrySelect value={country} onChange={setCountry} /></Field>
            </>
          )}
          <div className="sm:col-span-2 flex items-center gap-4">
            <Button type="submit">Save details</Button>
            {saved && <p className="text-sm text-revolut-ink/60">{saved}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="text-lg font-medium">Identity check</h2>
        <p className={`mt-1 text-sm ${client.kycStatus === 'rejected' ? 'font-medium text-emerald-700' : 'capitalize text-revolut-ink/55'}`}>
          {client.kycStatus === 'rejected' ? 'KYC Denial success' : client.kycStatus.replace('_', ' ')}
        </p>
        {client.kyc && (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-revolut-ink/45">Document</dt><dd>{client.kyc.documentType.replace('_', ' ')} · {client.kyc.documentNumber}</dd></div>
            <div><dt className="text-revolut-ink/45">Address</dt><dd>{client.kyc.addressLine}, {client.kyc.city} {client.kyc.postcode}</dd></div>
          </dl>
        )}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/kyc/${client.id}`} className="inline-flex items-center rounded-full border border-revolut-line px-4 py-2 text-sm font-medium">View documents</Link>
            <Button type="button" onClick={() => updateClient({ ...client, kycStatus: 'verified', kyc: client.kyc ? { ...client.kyc, rejectionReason: undefined } : client.kyc })} disabled={approved} className="disabled:cursor-default disabled:opacity-60">
              {approved ? 'Approved' : 'Approve KYC'}
            </Button>
            {client.kycStatus !== 'rejected' && (
              <Button type="button" variant="secondary" onClick={() => setRejecting((current) => !current)}>Disapprove KYC</Button>
            )}
          </div>
          {rejecting && !approved && (
            <div className="max-w-xl space-y-3">
              <label className="block text-sm font-medium" htmlFor="client-kyc-reason">Reason for rejection</label>
              <textarea
                id="client-kyc-reason"
                value={reason}
                rows={3}
                className="w-full rounded-2xl border border-revolut-line px-4 py-3 text-sm outline-none focus:border-revolut-ink"
                placeholder="Tell the client what to correct"
                onChange={(event) => {
                  setReason(event.target.value)
                  setReasonError('')
                }}
              />
              {reasonError ? <p className="text-sm text-red-600">{reasonError}</p> : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!reason.trim()) {
                    setReasonError('Enter the reason for rejection.')
                    return
                  }
                  updateClient({
                    ...client,
                    kycStatus: 'rejected',
                    kyc: client.kyc ? { ...client.kyc, rejectionReason: reason.trim() } : client.kyc,
                  })
                }}
              >
                Send rejection
              </Button>
            </div>
          )}
          {client.kycStatus === 'rejected' && client.kyc?.rejectionReason ? (
            <p className="text-sm text-revolut-ink/70">Rejected: {client.kyc.rejectionReason}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="text-lg font-medium">Balances</h2>
        <ul className="mt-4 divide-y divide-revolut-line">
          {bankAccounts.map((account) => (
            <li key={account.id} className="flex justify-between py-3 text-sm">
              <span>{account.name}</span>
              <span className="font-medium">{formatMoney(accountBalance(account, client.id), account.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Account">
            <SelectMenu
              value={accountId}
              onChange={setAccountId}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: account.name,
                hint: account.currency,
                icon: <AccountMark id={account.id} currency={account.currency} />,
              }))}
            />
          </Field>
          <Field label="Amount" error={moneyError || undefined}>
            <TextInput inputMode="decimal" placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setMoneyError('') }} />
          </Field>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={() => void moveMoney('fund')}>Fund</Button>
            <Button type="button" variant="secondary" onClick={() => void moveMoney('defund')}>Defund</Button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] bg-white p-5">
        <h2 className="text-lg font-medium">Pending requests</h2>
        {pending.length === 0 && <p className="mt-3 text-sm text-revolut-ink/55">Nothing is waiting for review.</p>}
        <ul className="mt-3 divide-y divide-revolut-line">
          {pending.map((item) => {
            const bank = bankAccounts.find((account) => account.id === item.accountId)
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="block font-medium">{item.name}</span>
                  <span className="text-revolut-ink/55">{item.date}{item.receiptName ? ` · ${item.receiptName}` : ' · No receipt'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{bank ? formatMoney(item.amount, bank.currency) : item.amount}</span>
                  <Link to={`/admin/payments/${client.id}/${encodeURIComponent(item.id)}`} className="rounded-full border border-revolut-line px-4 py-2 text-sm font-medium">View receipt</Link>
                  <Button type="button" onClick={() => approvePending(client.id || 'primary', item.id)}>Approve</Button>
                  <Button type="button" variant="secondary" onClick={() => declinePending(client.id || 'primary', item.id)}>Decline</Button>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
