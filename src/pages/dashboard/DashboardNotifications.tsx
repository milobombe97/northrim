import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../../auth/useAccount'
import { loadTransactions } from '../../data/banking'
import {
  buildNotifications,
  loadReadIds,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../data/notifications'

export function DashboardNotifications() {
  const account = useAccount()
  const [tick, setTick] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

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

  const items = useMemo(() => buildNotifications(account, loadTransactions()), [account, tick])
  const read = useMemo(() => loadReadIds(), [tick])
  const unread = items.filter((item) => !read.has(item.id))
  const visible = filter === 'unread' ? unread : items

  return (
    <main className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.04em]">Notifications</h1>
          <p className="mt-2 text-sm text-revolut-ink/60">
            {unread.length === 0 ? 'You are caught up.' : `${unread.length} unread.`} These stay in this browser.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink disabled:opacity-40"
          disabled={unread.length === 0}
          onClick={() => markAllNotificationsRead(items)}
        >
          Mark all as read
        </button>
      </div>
      <div className="mt-6 flex gap-2">
        {(['all', 'unread'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              filter === item ? 'bg-revolut-ink text-white' : 'bg-white text-revolut-ink/70'
            }`}
            onClick={() => setFilter(item)}
          >
            {item === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>
      <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
        {visible.length === 0 && (
          <li className="px-5 py-8 text-sm text-revolut-ink/55">No unread notifications.</li>
        )}
        {visible.map((item) => {
          const seen = read.has(item.id)
          return (
            <li key={item.id} className="border-b border-revolut-line last:border-b-0">
              <div className="flex items-start gap-3 px-5 py-4">
                <Link
                  to={`/dashboard/notifications/${encodeURIComponent(item.id)}`}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${seen ? 'bg-transparent' : 'bg-revolut-ink'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={`font-medium ${seen ? 'text-revolut-ink/70' : ''}`}>{item.title}</span>
                      <span className="text-xs text-revolut-ink/45">{item.date}</span>
                    </span>
                    <span className="mt-1 block text-sm text-revolut-ink/60">{item.body}</span>
                  </span>
                </Link>
                {!seen && (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-revolut-ink/60 hover:text-revolut-ink"
                    onClick={() => markNotificationRead(item.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
