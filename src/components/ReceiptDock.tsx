import { useEffect, useMemo, useState } from 'react'
import { useAccount } from '../auth/useAccount'
import { attachReceipt, dismissReceipt, loadClientTransactions, loadDismissedReceiptIds, markReceiptSent, paymentMethodName } from '../data/banking'
import { findReceiptFile } from '../data/fileStore'
import type { StoredFile } from '../data/files'
import { receiptPreview } from '../data/remote'
import { DepositNotice } from './DepositNotice'

function dockKey(clientId: string) {
  return `revolut-clone-receipt-minimized:${clientId}`
}

export function ReceiptDock() {
  const account = useAccount()
  const clientId = account?.id || ''
  const [tick, setTick] = useState(0)
  const [minimized, setMinimized] = useState(() => (clientId ? localStorage.getItem(dockKey(clientId)) === '1' : false))
  const notices = useMemo(() => {
    if (!clientId) return []
    const dismissed = loadDismissedReceiptIds(clientId)
    return loadClientTransactions(clientId).filter(
      (item) =>
        item.category === 'Top up' &&
        !dismissed.has(item.id) &&
        !item.receiptDismissed &&
        (item.status === 'pending' ||
          item.status === 'declined' ||
          item.status === 'approved'),
    )
  }, [clientId, tick])
  const [files, setFiles] = useState<Record<string, StoredFile>>({})

  useEffect(() => {
    if (!clientId) return
    setMinimized(localStorage.getItem(dockKey(clientId)) === '1')
  }, [clientId])

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    window.addEventListener('account-changed', sync)
    return () => {
      window.removeEventListener('ledger-changed', sync)
      window.removeEventListener('account-changed', sync)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all(
      notices.map(async (item) => {
        if (item.receiptFile?.dataUrl) return [item.id, item.receiptFile] as const
        if (item.receiptStored) {
          const stored = await findReceiptFile(clientId, item.id)
          if (stored?.dataUrl) return [item.id, stored] as const
        }
        if (item.receiptPath) {
          const preview = await receiptPreview(item.receiptPath, item.receiptName || 'Receipt', 'image/jpeg')
          if (preview) return [item.id, preview] as const
        }
        return null
      }),
    ).then((rows) => {
      if (!active) return
      const next: Record<string, StoredFile> = {}
      for (const row of rows) {
        if (row) next[row[0]] = row[1]
      }
      setFiles(next)
    })
    return () => {
      active = false
    }
  }, [clientId, notices])

  if (!account?.email || notices.length === 0) return null

  function minimize() {
    setMinimized(true)
    localStorage.setItem(dockKey(clientId), '1')
  }

  function expand() {
    setMinimized(false)
    localStorage.setItem(dockKey(clientId), '0')
  }

  if (minimized) {
    const label = notices.some((item) => item.status === 'declined')
      ? 'Payment declined'
      : notices.some((item) => item.status === 'approved')
        ? 'Payment successful'
        : notices.length === 1
          ? 'Deposit pending'
          : `${notices.length} deposits pending`
    return (
      <button
        type="button"
        className="fixed top-1/2 right-0 z-50 -translate-y-1/2 rounded-l-2xl bg-revolut-ink px-2.5 py-4 text-xs font-medium text-white shadow-[0_8px_24px_rgba(25,28,31,0.25)] [writing-mode:vertical-rl]"
        onClick={expand}
      >
        {label}
      </button>
    )
  }

  return (
    <aside className="fixed right-4 bottom-4 z-50 flex max-h-[min(34rem,calc(100vh-2rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-revolut-line bg-white shadow-[0_16px_40px_rgba(25,28,31,0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-revolut-line px-4 py-3">
        <p className="text-sm font-medium">
          {notices.length === 1 ? 'Deposit receipt' : `${notices.length} deposit receipts`}
        </p>
        <button type="button" className="text-sm text-revolut-ink/55 hover:text-revolut-ink" onClick={minimize}>
          Minimize
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto p-3">
        {notices.map((item) => (
          <DepositNotice
            key={item.id}
            method={paymentMethodName(item)}
            email={account.email}
            receiptName={item.receiptName}
            file={files[item.id]}
            stored={Boolean(item.receiptStored || item.receiptFile?.dataUrl)}
            sent={item.receiptSent}
            outcome={item.status === 'approved' || item.status === 'declined' ? item.status : 'pending'}
            onUpload={(file) => attachReceipt(item.id, file, clientId)}
            onSend={() => void markReceiptSent(item.id, clientId)}
            onDismiss={() => {
              dismissReceipt(item.id, clientId)
              setFiles((current) => {
                const next = { ...current }
                delete next[item.id]
                return next
              })
              setTick((value) => value + 1)
            }}
          />
        ))}
      </div>
    </aside>
  )
}
