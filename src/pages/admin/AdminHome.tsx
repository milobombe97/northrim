import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadClients, type Account } from '../../auth/session'
import { accountStatusOf } from '../../data/adminAccounts'

function statusLabel(account: Account) {
  const status = accountStatusOf(account)
  if (status === 'deleted') return 'Deleted'
  if (status === 'suspended') return 'Suspended'
  if (account.kycStatus === 'verified') return 'Verified'
  if (account.kycStatus === 'in_review') return 'KYC in review'
  if (account.kycStatus === 'rejected') return 'KYC declined'
  return 'KYC not started'
}

export function AdminHome() {
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('clients-changed', sync)
    window.addEventListener('account-changed', sync)
    return () => {
      window.removeEventListener('clients-changed', sync)
      window.removeEventListener('account-changed', sync)
    }
  }, [])

  const clients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return loadClients().filter((item) => {
      const haystack = `${item.firstName} ${item.lastName} ${item.email} ${item.phone}`.toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [query, tick])

  return (
    <main className="max-w-5xl">
      <h1 className="text-3xl font-medium tracking-[-0.04em]">Clients</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">Everyone who has an account in this browser.</p>
      <label className="mt-6 block max-w-sm">
        <span className="sr-only">Search clients</span>
        <input
          value={query}
          placeholder="Search name or email"
          className="w-full rounded-full border border-revolut-line bg-white px-4 py-2 text-sm outline-none focus:border-revolut-ink"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
        {clients.length === 0 && <li className="px-5 py-8 text-sm text-revolut-ink/55">No clients yet.</li>}
        {clients.map((client) => (
          <li key={client.id} className="border-b border-revolut-line last:border-b-0">
            <Link to={`/admin/clients/${client.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70">
              <span>
                <span className="block font-medium">{client.firstName} {client.lastName}</span>
                <span className="block text-sm text-revolut-ink/55">{client.email}</span>
              </span>
              <span className="text-sm text-revolut-ink/60">{statusLabel(client)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
