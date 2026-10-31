import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Glyph } from '../../components/PasswordInput'
import { buildAdminNotifications, loadAdminReadIds, markAdminNotificationRead } from '../../data/adminNotifications'
import { useAdminTick } from './useAdminTick'

export function AdminNotificationDetail() {
  const { id = '' } = useParams()
  const tick = useAdminTick()
  const noticeId = decodeURIComponent(id)
  const item = useMemo(() => buildAdminNotifications().find((entry) => entry.id === noticeId), [noticeId, tick])
  const seen = item ? loadAdminReadIds().has(item.id) : false

  useEffect(() => {
    if (item && !loadAdminReadIds().has(item.id)) markAdminNotificationRead(item.id)
  }, [item])

  if (!item) {
    return (
      <main>
        <Link to="/admin/notifications" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">Notifications</Link>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">Notification not found</h1>
      </main>
    )
  }

  return (
    <main className="max-w-3xl">
      <Link to="/admin/notifications" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">Notifications</Link>
      <div className="mt-4 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-revolut-ink text-white">
          <Glyph name={item.icon} className="size-5" />
        </span>
        <div>
          <p className="text-sm text-revolut-ink/55">{item.date}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-[-0.04em]">{item.title}</h1>
        </div>
      </div>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-revolut-ink/75">{item.body}</p>
      <dl className="mt-6 divide-y divide-revolut-line overflow-hidden rounded-[1.5rem] bg-white text-sm">
        <div className="flex justify-between gap-4 px-5 py-3"><dt className="text-revolut-ink/45">Status</dt><dd>{seen ? 'Read' : 'Unread'}</dd></div>
        <div className="flex justify-between gap-4 px-5 py-3"><dt className="text-revolut-ink/45">From</dt><dd>North Rim Inc</dd></div>
      </dl>
      <Link to={item.href} className="mt-6 inline-flex rounded-full bg-revolut-ink px-5 py-2.5 text-sm font-medium text-white">
        Open related page
      </Link>
    </main>
  )
}
