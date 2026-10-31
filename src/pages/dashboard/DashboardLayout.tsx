import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ReceiptDock } from '../../components/ReceiptDock'
import { BrandWordmark } from '../../components/BrandWordmark'
import { brand } from '../../config/brand'
import { useAccount } from '../../auth/useAccount'
import { accountStatusOf } from '../../data/adminAccounts'
import { loadTransactions } from '../../data/banking'
import { subscribeFinancialSync } from '../../data/finance'
import { buildNotifications, loadReadIds } from '../../data/notifications'
import { supabaseEnabled } from '../../lib/supabase'

const links = [
  { to: '/dashboard', label: 'Home', end: true, icon: 'home' },
  { to: '/dashboard/transactions', label: 'Transactions', icon: 'list' },
  { to: '/dashboard/topup', label: 'Add money', icon: 'plus' },
  { to: '/dashboard/withdraw', label: 'Withdraw', icon: 'withdraw' },
  { to: '/dashboard/payments', label: 'Payments', icon: 'arrows' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/dashboard/cards', label: 'Cards', icon: 'card' },
  { to: '/dashboard/profile', label: 'Profile', icon: 'user' },
  { to: '/dashboard/settings', label: 'Settings', icon: 'sliders' },
] as const

export function DashboardLayout() {
  const account = useAccount()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [noticeTick, setNoticeTick] = useState(0)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const sync = () => setNoticeTick((value) => value + 1)
    window.addEventListener('ledger-changed', sync)
    window.addEventListener('notifications-changed', sync)
    window.addEventListener('account-changed', sync)
    return () => {
      window.removeEventListener('ledger-changed', sync)
      window.removeEventListener('notifications-changed', sync)
      window.removeEventListener('account-changed', sync)
    }
  }, [])

  useEffect(() => {
    if (!account?.id || !supabaseEnabled()) return
    return subscribeFinancialSync(account.id)
  }, [account?.id])

  const unread = useMemo(() => {
    const read = loadReadIds()
    return buildNotifications(account, loadTransactions()).filter((item) => !read.has(item.id)).length
  }, [account, noticeTick])

  if (!account) return <Navigate to="/signin" replace />
  if (accountStatusOf(account) === 'deleted') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Account closed</h1>
        <p className="mt-3 text-sm text-revolut-ink/65">
          This North Rim Inc account is no longer available. Contact support if you think this is a mistake.
        </p>
        <button
          type="button"
          className="mt-6 text-left text-sm font-medium underline-offset-4 hover:underline"
          onClick={() => {
            void signOut().then(() => navigate('/signin'))
          }}
        >
          Log out
        </button>
      </main>
    )
  }
  if (accountStatusOf(account) === 'suspended') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Account suspended</h1>
        <p className="mt-3 text-sm text-revolut-ink/65">
          North Rim Inc has suspended this account. You cannot move money until an admin reactivates it.
        </p>
        <button
          type="button"
          className="mt-6 text-left text-sm font-medium underline-offset-4 hover:underline"
          onClick={() => {
            void signOut().then(() => navigate('/signin'))
          }}
        >
          Log out
        </button>
      </main>
    )
  }
  if (account.kycStatus === 'not_started') return <Navigate to="/kyc" replace />

  return (
    <>
    <ReceiptDock />
    <div className="min-h-screen bg-[#f3f4f5] text-revolut-ink lg:grid lg:grid-cols-[248px_1fr]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-revolut-line bg-white px-4 py-3 lg:hidden">
        <NavLink to="/" className="text-lg">
          <BrandWordmark />
        </NavLink>
        <div className="flex items-center">
          <NavLink
            to="/dashboard/notifications"
            className="relative grid size-10 place-items-center rounded-full hover:bg-revolut-muted"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <DashIcon name="bell" />
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
        <NavLink to="/" className="hidden px-3 text-lg lg:block">
          <BrandWordmark />
        </NavLink>
        <nav className="flex flex-col gap-1 lg:mt-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : undefined}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive ? 'bg-revolut-ink text-white' : 'text-revolut-ink/70 hover:bg-revolut-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <DashIcon name={link.icon} />
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
          className="mt-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-revolut-ink/55 hover:bg-revolut-muted hover:text-revolut-ink"
          onClick={() => {
            void signOut().then(() => navigate('/signin'))
          }}
        >
          <DashIcon name="logout" />
          Log out
        </button>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        {account.kycStatus === 'in_review' && (
          <p className="bg-amber-50 px-5 py-3 text-sm text-amber-950 lg:px-8">
            Identity check is pending review. North Rim Inc limits some payments until it is approved.
          </p>
        )}
        {account.kycStatus === 'rejected' && (
          <div className="bg-red-50 px-5 py-3 text-sm text-red-950 lg:px-8">
            <p>Identity check was declined.</p>
            {account.kyc?.rejectionReason ? <p className="mt-1">{account.kyc.rejectionReason}</p> : null}
            <Link to="/kyc" className="mt-2 inline-block font-medium underline">Resubmit identity check</Link>
          </div>
        )}
        <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
        <footer className="px-5 pb-8 text-sm text-revolut-ink/50 lg:px-8">
          <p>© {brand.legalName} 2026. All rights reserved.</p>
        </footer>
      </div>
    </div>
    </>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      {open ? (
        <path d="M5 5l10 10M15 5 5 15" />
      ) : (
        <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
      )}
    </svg>
  )
}

function DashIcon({ name }: { name: (typeof links)[number]['icon'] | 'logout' }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'size-4 shrink-0',
  }
  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M3.5 8.8 10 3.5l6.5 5.3" />
        <path d="M5.5 8.2V16h9V8.2" />
      </svg>
    )
  }
  if (name === 'list') {
    return (
      <svg {...common}>
        <path d="M4.5 6h11M4.5 10h11M4.5 14h11" />
      </svg>
    )
  }
  if (name === 'plus') {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="6.25" />
        <path d="M10 7.25v5.5M7.25 10h5.5" />
      </svg>
    )
  }
  if (name === 'withdraw') {
    return (
      <svg {...common}>
        <path d="M10 3.5v7.5" />
        <path d="M7 6.5 10 3.5l3 3" />
        <path d="M4.5 11.5h11v4.5h-11z" />
      </svg>
    )
  }
  if (name === 'arrows') {
    return (
      <svg {...common}>
        <path d="M4 7.5h11.5M12.5 4.5 15.5 7.5 12.5 10.5" />
        <path d="M16 12.5H4.5M7.5 9.5 4.5 12.5 7.5 15.5" />
      </svg>
    )
  }
  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="2.75" y="5" width="14.5" height="10" rx="1.75" />
        <path d="M2.75 8.25h14.5" />
      </svg>
    )
  }
  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 3.2.8 4.6 1.3 5.2H4.2c.5-.6 1.3-2 1.3-5.2Z" />
        <path d="M8.2 15.2a1.8 1.8 0 0 0 3.6 0" />
      </svg>
    )
  }
  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="10" cy="7.25" r="2.4" />
        <path d="M4.75 16.25c.7-2.4 2.7-3.6 5.25-3.6s4.55 1.2 5.25 3.6" />
      </svg>
    )
  }
  if (name === 'sliders') {
    return (
      <svg {...common}>
        <path d="M4 6.5h12M4 13.5h12" />
        <circle cx="8" cy="6.5" r="1.6" />
        <circle cx="12.5" cy="13.5" r="1.6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M8 4.5H5.5A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H8" />
      <path d="M11 6.5 16 10l-5 3.5" />
      <path d="M16 10H8" />
    </svg>
  )
}
