import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field } from '../../components/Field'
import { Glyph } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import {
  buildAdminNotifications,
  loadAdminReadIds,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../data/adminNotifications'
import { useAdminTick } from './useAdminTick'

export function AdminNotifications() {
  const tick = useAdminTick()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const items = useMemo(() => buildAdminNotifications(), [tick])
  const read = useMemo(() => loadAdminReadIds(), [tick])
  const unread = items.filter((item) => !read.has(item.id))
  const visible = filter === 'unread' ? unread : items

  return (
    <main className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.04em]">Notifications</h1>
          <p className="mt-2 text-sm text-revolut-ink/60">
            {unread.length === 0 ? 'Nothing is waiting.' : `${unread.length} unread.`} Identity checks and payments that need a decision.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink disabled:opacity-40"
          disabled={unread.length === 0}
          onClick={() => markAllAdminNotificationsRead(items)}
        >
          Mark all as read
        </button>
      </div>
      <div className="mt-6 max-w-xs">
        <Field label="Show">
          <SelectMenu
            value={filter}
            onChange={(value) => setFilter(value as 'all' | 'unread')}
            options={[
              { value: 'all', label: 'All', hint: `${items.length} notifications`, icon: <Glyph name="bell" /> },
              { value: 'unread', label: 'Unread', hint: `${unread.length} waiting`, icon: <Glyph name="shield" /> },
            ]}
          />
        </Field>
      </div>
      <ul className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
        {visible.length === 0 && <li className="px-5 py-8 text-sm text-revolut-ink/55">No notifications in this list.</li>}
        {visible.map((item) => {
          const seen = read.has(item.id)
          return (
            <li key={item.id} className="border-b border-revolut-line last:border-b-0">
              <div className="flex items-start gap-3 px-5 py-4">
                <Link to={`/admin/notifications/${encodeURIComponent(item.id)}`} className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${seen ? 'bg-revolut-muted text-revolut-ink/45' : 'bg-revolut-ink text-white'}`}>
                    <Glyph name={item.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{item.title}</span>
                    <span className="mt-1 block text-sm text-revolut-ink/60">{item.body}</span>
                    <span className="mt-1 block text-xs text-revolut-ink/45">{item.date}</span>
                  </span>
                </Link>
                {!seen && (
                  <button type="button" className="shrink-0 text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink" onClick={() => markAdminNotificationRead(item.id)}>
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
