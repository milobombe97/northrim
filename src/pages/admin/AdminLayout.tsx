import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useAdmin } from '../../auth/useAdmin'
import { Glyph, type FieldIconName } from '../../components/PasswordInput'
import { buildAdminNotifications, loadAdminReadIds } from '../../data/adminNotifications'
import { useAdminTick } from './useAdminTick'

const links: { to: string; label: string; icon: FieldIconName; end?: boolean; superOnly?: boolean }[] = [
  { to: '/admin', label: 'Clients', icon: 'user', end: true },
  { to: '/admin/kyc', label: 'KYC', icon: 'shield' },
  { to: '/admin/payments', label: 'Payments', icon: 'banknote' },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: 'withdraw' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/admin/settings', label: 'Profile', icon: 'user' },
  { to: '/admin/team', label: 'Admins', icon: 'lock' },
]

export function AdminLayout() {
  const admin = useAdmin()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const tick = useAdminTick()
  const unread = useMemo(
    () => buildAdminNotifications().filter((item) => !loadAdminReadIds().has(item.id)).length,
    [tick],
  )

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (!admin) return <Navigate to="/admin/login" replace />

  const items = links.filter((link) => !link.superOnly || admin.role === 'super')

  return (
    <div className="min-h-screen bg-[#f3f4f5] text-revolut-ink lg:grid lg:grid-cols-[248px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-revolut-line bg-white px-4 py-3 lg:hidden">
        <NavLink to="/admin" className="text-lg font-semibold tracking-[-0.03em]">
          North Rim
        </NavLink>
        <div className="flex items-center">
          <NavLink
            to="/admin/notifications"
            className="relative grid size-10 place-items-center rounded-full hover:bg-revolut-muted"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Glyph name="bell" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-revolut-ink px-1 text-[10px] leading-4 font-medium text-white">
                {unread}
              </span>
            )}
          </NavLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-revolut-muted"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-revolut-ink/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-revolut-line bg-white px-3 py-5 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:overflow-y-auto ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavLink to="/admin" className="hidden px-3 text-lg font-semibold tracking-[-0.03em] lg:block">
          North Rim
        </NavLink>
        <p className="px-3 text-xs text-revolut-ink/50">{admin.role === 'super' ? 'Super admin' : 'Admin'}</p>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${isActive ? 'bg-revolut-ink text-white' : 'text-revolut-ink/70 hover:bg-revolut-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Glyph name={link.icon} />
                  <span className="min-w-0 flex-1">{link.label}</span>
                  {link.icon === 'bell' && unread > 0 && (
                    <span className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-medium ${isActive ? 'bg-white text-revolut-ink' : 'bg-revolut-ink text-white'}`}>
                      {unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="mt-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-revolut-ink/55 hover:bg-revolut-muted"
          onClick={() => {
            void signOut().then(() => navigate('/admin/login'))
          }}
        >
          <Glyph name="logout" />
          Log out
        </button>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
        <footer className="px-5 pb-8 text-sm text-revolut-ink/50 lg:px-8">
          <p>© North Rim Inc 2026. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      {open ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />}
    </svg>
  )
}
