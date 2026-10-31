import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadClients } from '../../auth/session'
import { bankAccounts, formatMoney, loadClientTransactions } from '../../data/banking'
import { clientNameForId, listWithdrawals, reviewWithdrawal, type WithdrawalRequest } from '../../data/finance'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { useAdminTick } from './useAdminTick'

export function AdminWithdrawalsPage() {
  const tick = useAdminTick()
  const [rows, setRows] = useState<WithdrawalRequest[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  void tick

  useEffect(() => {
    listWithdrawals('pending').then((remote) => {
      if (remote.length > 0 || supabase) {
        setRows(remote)
        return
      }
      const local: WithdrawalRequest[] = loadClients().flatMap((client) =>
        loadClientTransactions(client.id || 'primary')
          .filter((item) => item.category === 'Withdrawal' && item.status === 'pending')
          .map((item) => ({
            id: item.id,
            user_id: client.id || 'primary',
            account_code: item.accountId,
            amount: Math.abs(item.amount),
            currency: bankAccounts.find((a) => a.id === item.accountId)?.currency ?? 'GBP',
            payee_name: item.name.replace(/^Withdrawal · /, '').split(' · ')[0] ?? item.name,
            method: item.method ?? '',
            country: '',
            transaction_id: item.id,
            status: 'pending',
            rejection_reason: null,
            created_at: item.date,
          })),
      )
      setRows(local)
    })
  }, [tick])

  async function decide(row: WithdrawalRequest, decision: 'approved' | 'rejected') {
    setError('')
    setBusyId(row.id)
    const result = await reviewWithdrawal(row.id, decision)
    setBusyId('')
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.localOnly) {
      const { approvePending, declinePending } = await import('../../data/banking')
      if (decision === 'approved') approvePending(row.user_id, row.transaction_id)
      else declinePending(row.user_id, row.transaction_id)
    }
    setRows((current) => current.filter((item) => item.id !== row.id))
  }

  return (
    <main className="max-w-5xl">
      <h1 className="text-3xl font-medium tracking-[-0.04em]">Withdrawals</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">Approve or reject outbound withdrawal requests. Balances update only after approval.</p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-6 overflow-hidden rounded-[1.5rem] bg-white">
        {rows.length === 0 && <li className="px-5 py-8 text-sm text-revolut-ink/55">No withdrawals are waiting.</li>}
        {rows.map((row) => {
          const account = bankAccounts.find((item) => item.id === row.account_code)
          const currency = account?.currency ?? (row.currency as 'GBP' | 'EUR' | 'USD')
          return (
            <li key={row.id} className="border-b border-revolut-line px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{row.payee_name}</p>
                  <p className="text-sm text-revolut-ink/55">
                    {clientNameForId(row.user_id)} · {row.method || 'Withdrawal'} · {account?.name ?? row.account_code}
                  </p>
                  <p className="mt-1 text-sm font-medium tabular-nums">{formatMoney(row.amount, currency)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={busyId === row.id} onClick={() => void decide(row, 'approved')}>
                    Approve
                  </Button>
                  <Button type="button" variant="secondary" disabled={busyId === row.id} onClick={() => void decide(row, 'rejected')}>
                    Reject
                  </Button>
                  <Link
                    to={`/admin/clients/${row.user_id}`}
                    className="inline-flex items-center rounded-full border border-revolut-line px-4 py-2 text-sm font-medium"
                  >
                    Client
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
