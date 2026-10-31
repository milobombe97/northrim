import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadClients, type Account } from '../../auth/session'
import { Field } from '../../components/Field'
import { Glyph } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import { useAdminTick } from './useAdminTick'

function kycLabel(account: Account) {
  if (account.kycStatus === 'in_review') return 'In review'
  if (account.kycStatus === 'verified') return 'Approved'
  if (account.kycStatus === 'rejected') return 'Disapproved'
  return 'Not started'
}

export function AdminKycPage() {
  const tick = useAdminTick()
  const [filter, setFilter] = useState<'review' | 'all'>('review')
  const clients = useMemo(() => {
    const rows = loadClients().filter((item) => item.kyc || item.kycStatus === 'in_review')
    return filter === 'review' ? rows.filter((item) => item.kycStatus === 'in_review') : rows
  }, [filter, tick])

  return (
    <main className="max-w-5xl">
      <h1 className="text-3xl font-medium tracking-[-0.04em]">KYC</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">Open a client to view the identity documents before approving.</p>
      <div className="mt-6 max-w-xs">
        <Field label="Show">
          <SelectMenu
            value={filter}
            onChange={(value) => setFilter(value as 'review' | 'all')}
            options={[
              { value: 'review', label: 'In review', hint: 'Waiting for a decision', icon: <Glyph name="shield" /> },
              { value: 'all', label: 'All documents', hint: 'Every submitted check', icon: <Glyph name="card" /> },
            ]}
          />
        </Field>
      </div>
      <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
        {clients.length === 0 && <li className="px-5 py-8 text-sm text-revolut-ink/55">No identity checks in this list.</li>}
        {clients.map((client) => (
          <li key={client.id} className="border-b border-revolut-line last:border-b-0">
            <Link to={`/admin/kyc/${client.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-revolut-muted/70">
              <span>
                <span className="block font-medium">{client.firstName} {client.lastName}</span>
                <span className="block text-sm text-revolut-ink/55">{client.email}</span>
              </span>
              <span className="text-sm text-revolut-ink/60">{kycLabel(client)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
