import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { attachReceipt, bankAccounts, formatMoney, loadTransactions, paymentMethodName, supportEmail } from '../../data/banking'
import { readStoredFile } from '../../data/files'
import { loadAccount } from '../../auth/session'
import { FilePreview } from '../../components/FilePreview'
import { findReceiptFile } from '../../data/fileStore'
import { receiptPreview } from '../../data/remote'
import type { StoredFile } from '../../data/files'

export function DashboardTransactionDetail() {
  const { id = '' } = useParams()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    return () => window.removeEventListener('ledger-changed', sync)
  }, [])

  const item = loadTransactions().find((entry) => entry.id === decodeURIComponent(id))
  void tick
  const receiptId = item?.id ?? ''
  const inlineUrl = item?.receiptFile?.dataUrl ?? ''
  const receiptPath = item?.receiptPath ?? ''
  const receiptName = item?.receiptName ?? ''
  const receiptStored = Boolean(item?.receiptStored)
  const [file, setFile] = useState<StoredFile | undefined>(item?.receiptFile)

  useEffect(() => {
    let active = true
    const clientId = loadAccount()?.id || 'primary'
    if (inlineUrl && item?.receiptFile) {
      setFile(item.receiptFile)
      return
    }
    if (!receiptStored && !receiptPath) {
      setFile(undefined)
      return
    }
    findReceiptFile(clientId, receiptId).then(async (stored) => {
      if (!active) return
      if (stored?.dataUrl) {
        setFile(stored)
        return
      }
      if (receiptPath) {
        const preview = await receiptPreview(receiptPath, receiptName || 'Receipt', 'image/jpeg')
        if (active) setFile(preview ?? undefined)
        return
      }
      if (active) setFile(undefined)
    })
    return () => {
      active = false
    }
  }, [receiptId, inlineUrl, receiptPath, receiptStored, receiptName])

  if (!item) {
    return (
      <main className="max-w-3xl">
        <BackLink to="/dashboard" label="Activity" />
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">Transaction not found</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">This payment is not on the account stored in this browser.</p>
      </main>
    )
  }

  const account = bankAccounts.find((entry) => entry.id === item.accountId)
  const currency = account?.currency ?? 'GBP'
  const declined = item.status === 'declined'
  const approved = item.status === 'approved'
  const pending = item.status === 'pending'
  const withdrawal = item.category === 'Withdrawal'
  const transfer = item.category === 'Transfer'
  const receiptRequired = pending && !withdrawal && !transfer
  const fileSaved = Boolean(item.receiptStored || item.receiptFile?.dataUrl)
  const status = declined
    ? 'Declined'
    : approved
      ? 'Successful'
      : pending
        ? withdrawal
          ? 'Pending verification'
          : transfer
            ? 'Pending verification'
            : item.receiptSent
            ? 'Pending review'
            : fileSaved
              ? 'Receipt ready to send'
              : 'Receipt needed'
        : 'Completed'

  return (
    <main className="max-w-3xl">
      <BackLink to="/dashboard" label="Activity" />
      <p className="mt-4 text-sm text-revolut-ink/55">{item.category}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">{item.name}</h1>
      <p className={`mt-3 text-4xl font-medium tracking-[-0.04em] tabular-nums ${declined ? 'text-red-700' : pending ? 'text-amber-700' : item.amount > 0 ? 'text-emerald-700' : ''}`}>
        {declined ? 'Declined ' : pending ? 'Pending ' : item.amount > 0 ? '+' : ''}
        {formatMoney(item.amount, currency)}
      </p>
      <dl className="mt-8 divide-y divide-revolut-line overflow-hidden rounded-[1.5rem] bg-white">
        <Row label="Status" value={status} />
        <Row label="Date" value={item.date} />
        <Row label="Account" value={account?.name ?? item.accountId} />
        <Row label="Bank" value="North Rim Inc" />
        <Row label="Category" value={item.category} />
        {item.method ? <Row label="Payment method" value={paymentMethodName(item)} /> : null}
        <Row label="Reference" value={item.id} />
        {receiptRequired ? <Row label="Receipt" value={item.receiptName ?? 'Not uploaded'} /> : null}
      </dl>
      {file ? (
        <div className="mt-6">
          <FilePreview file={file} fallbackName={item.receiptName} />
        </div>
      ) : null}
      {receiptRequired && (!item.receiptSent || !fileSaved) && (
        <label className="mt-4 inline-flex cursor-pointer rounded-full bg-revolut-ink px-4 py-2 text-sm font-medium text-white">
          {fileSaved ? 'Replace receipt' : 'Upload receipt'}
          <input
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const clientId = loadAccount()?.id || 'primary'
              readStoredFile(file).then((stored) => attachReceipt(item.id, stored, clientId))
            }}
          />
        </label>
      )}
      {pending && withdrawal && (
        <p className="mt-4 max-w-xl text-sm font-medium text-amber-800" role="status">
          Withdrawal pending verification. You will receive a withdrawal notification once your transaction has been processed.
        </p>
      )}
      {approved && transfer && (
        <p className="mt-4 max-w-xl text-sm text-emerald-700" role="status">
          This transfer is complete. The exact amount was debited from your account and credited to the recipient.
        </p>
      )}
      {receiptRequired && (
        <p className="mt-4 max-w-xl text-sm text-revolut-ink/60">
          {item.receiptSent
            ? 'The receipt has been sent and is pending review. Once approved, it can take 1 to 24 hours to show in the account.'
            : 'The balance stays unchanged until support approves the receipt.'}
        </p>
      )}
      {declined && (
        <p className="mt-4 max-w-xl text-sm text-revolut-ink/70">
          This payment was rejected. Contact the support team at{' '}
          <a href={`mailto:${supportEmail}`} className="font-medium underline-offset-4 hover:underline">{supportEmail}</a>.
        </p>
      )}
      {approved && !transfer && <p className="mt-4 max-w-xl text-sm text-emerald-700">This payment was successful. The funds are in the account.</p>}
    </main>
  )
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink">
      {label}
    </Link>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
      <dt className="text-revolut-ink/50">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  )
}
