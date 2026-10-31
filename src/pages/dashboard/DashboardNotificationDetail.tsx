import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAccount } from '../../auth/useAccount'
import { loadTransactions } from '../../data/banking'
import { buildNotifications, loadReadIds, markNotificationRead } from '../../data/notifications'

export function DashboardNotificationDetail() {
  const { id = '' } = useParams()
  const account = useAccount()
  const [tick, setTick] = useState(0)
  const noticeId = decodeURIComponent(id)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    window.addEventListener('notifications-changed', sync)
    window.addEventListener('account-changed', sync)
    return () => {
      window.removeEventListener('ledger-changed', sync)
      window.removeEventListener('notifications-changed', sync)
      window.removeEventListener('account-changed', sync)
    }
  }, [])

  const item = useMemo(
    () => buildNotifications(account, loadTransactions()).find((entry) => entry.id === noticeId),
    [account, noticeId, tick],
  )

  useEffect(() => {
    if (item && !loadReadIds().has(item.id)) markNotificationRead(item.id)
  }, [item])

  if (!item) {
    return (
      <main className="max-w-3xl">
        <Link to="/dashboard/notifications" className="text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink">
          Notifications
        </Link>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">Notification not found</h1>
      </main>
    )
  }

  const seen = loadReadIds().has(item.id)

  return (
    <main className="max-w-3xl">
      <Link to="/dashboard/notifications" className="text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink">
        Notifications
      </Link>
      <p className="mt-4 text-sm text-revolut-ink/55">{item.date}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">{item.title}</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-revolut-ink/75">{item.body}</p>
      <dl className="mt-8 divide-y divide-revolut-line overflow-hidden rounded-[1.5rem] bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
          <dt className="text-revolut-ink/50">Status</dt>
          <dd className="font-medium">{seen ? 'Read' : 'Unread'}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
          <dt className="text-revolut-ink/50">From</dt>
          <dd className="font-medium">North Rim Inc</dd>
        </div>
      </dl>
      <Link
        to={item.href}
        className="mt-6 inline-flex rounded-full bg-revolut-ink px-5 py-2.5 text-sm font-medium text-white"
      >
        Open related page
      </Link>
    </main>
  )
}
