import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAccount } from '../auth/useAccount'
import { megaMenus, type MegaMenuId } from '../data/megaMenu'
import { useMegaMenu, type OpenMenu } from '../hooks/useMegaMenu'
import { Button } from './Button'
import { KidsDropdown } from './KidsDropdown'
import { MegaMenuPanel } from './MegaMenuPanel'
import { ScrollHeader } from './ScrollHeader'

const megaNavItems: { id: MegaMenuId; label: string; to: string; end?: boolean }[] = [
  { id: 'personal', label: 'Personal', to: '/', end: true },
  { id: 'business', label: 'Business', to: '/business' },
  { id: 'company', label: 'Company', to: '/company' },
]

function navTextClass(isDark: boolean, active: boolean) {
  if (!isDark) {
    return active ? 'text-revolut-ink' : 'text-revolut-ink/70 hover:text-revolut-ink'
  }
  return active
    ? 'text-white group-data-[scrolled=true]:!text-revolut-ink'
    : 'text-white/85 hover:text-white group-data-[scrolled=true]:!text-revolut-ink/70 group-data-[scrolled=true]:hover:!text-revolut-ink'
}

export function Header({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const location = useLocation()
  const { openMenu, isMegaOpen, open, close, closeImmediately, cancelClose } = useMegaMenu()
  const [mobileOpen, setMobileOpen] = useState(false)
  const account = useAccount()

  const headerTheme = isMegaOpen || mobileOpen ? 'light' : theme
  const isDark = headerTheme === 'dark'

  const activeMega =
    openMenu && openMenu !== 'kids' ? megaMenus[openMenu as MegaMenuId] : null

  return (
    <>
      <ScrollHeader theme={headerTheme} forceGlass={isMegaOpen || mobileOpen}>
        <div
          className="relative"
          onPointerLeave={() => {
            if (openMenu !== 'kids') close()
          }}
        >
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-10">
            <Link
              to="/"
              onClick={closeImmediately}
              className={`relative z-10 text-[1.125rem] font-semibold tracking-[-0.03em] ${
                isDark
                  ? 'text-white group-data-[scrolled=true]:!text-revolut-ink'
                  : 'text-revolut-ink'
              }`}
            >
              North Rim Inc
            </Link>

            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
              aria-label="Main"
              onPointerEnter={cancelClose}
            >
              {megaNavItems.slice(0, 2).map((item) => (
                <MegaLink
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  pathname={location.pathname}
                  openMenu={openMenu}
                  open={open}
                  closeImmediately={closeImmediately}
                />
              ))}

              <div className="relative">
                <button
                  type="button"
                  className={`type-label transition-colors ${navTextClass(
                    isDark,
                    openMenu === 'kids' || location.pathname.startsWith('/kids-teens'),
                  )}`}
                  aria-expanded={openMenu === 'kids'}
                  aria-haspopup="menu"
                  onClick={() => open('kids')}
                  onMouseEnter={() => {
                    if (openMenu && openMenu !== 'kids') closeImmediately()
                  }}
                >
                  Kids &amp; Teens
                </button>
                <KidsDropdown open={openMenu === 'kids'} onClose={closeImmediately} />
              </div>

              {megaNavItems.slice(2).map((item) => (
                <MegaLink
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  pathname={location.pathname}
                  openMenu={openMenu}
                  open={open}
                  closeImmediately={closeImmediately}
                />
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {account ? (
                <Link
                  to="/dashboard"
                  className={`type-label ${
                    isDark
                      ? 'text-white group-data-[scrolled=true]:!text-revolut-ink'
                      : 'text-revolut-ink'
                  }`}
                >
                  Account
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className={`hidden type-label sm:inline ${
                    isDark
                      ? 'text-white/90 hover:text-white group-data-[scrolled=true]:!text-revolut-ink/80 group-data-[scrolled=true]:hover:!text-revolut-ink'
                      : 'text-revolut-ink/80 hover:text-revolut-ink'
                  }`}
                >
                  Log in
                </Link>
              )}
              {!account && (
                <Button
                  variant={isDark ? 'nav' : 'secondary'}
                  href="/signup"
                  className={`!px-5 !py-2 ${
                    isDark
                      ? 'group-data-[scrolled=true]:!bg-revolut-ink group-data-[scrolled=true]:!text-white'
                      : ''
                  }`}
                >
                  Sign up
                </Button>
              )}
              <button
                type="button"
                className={`inline-flex rounded-lg p-2 transition-colors md:hidden ${
                  isDark
                    ? 'text-white group-data-[scrolled=true]:!text-revolut-ink'
                    : 'text-revolut-ink'
                }`}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => {
                  closeImmediately()
                  setMobileOpen((v) => !v)
                }}
              >
                <span className="sr-only">Menu</span>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                  {mobileOpen ? (
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  ) : (
                    <path
                      d="M3 6h14M3 10h14M3 14h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {activeMega && (
              <MegaMenuPanel
                config={activeMega}
                onClose={closeImmediately}
                onPointerEnter={cancelClose}
                onPointerLeave={close}
              />
            )}
          </AnimatePresence>

          {mobileOpen && (
            <div className="border-t border-revolut-line bg-white px-5 py-6 md:hidden">
              <div className="space-y-4">
                {megaNavItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="block text-base font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/kids-teens"
                  className="block text-base font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Kids &amp; Teens
                </Link>
                {account ? (
                  <Link
                    to="/dashboard"
                    className="block text-base font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Account
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="block text-base font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="block text-base font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollHeader>

      <AnimatePresence>
        {isMegaOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
            onClick={closeImmediately}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function MegaLink({
  item,
  isDark,
  pathname,
  openMenu,
  open,
  closeImmediately,
}: {
  item: { id: MegaMenuId; label: string; to: string; end?: boolean }
  isDark: boolean
  pathname: string
  openMenu: OpenMenu
  open: (menu: OpenMenu) => void
  closeImmediately: () => void
}) {
  const routeActive = item.end ? pathname === '/' : pathname.startsWith(item.to)
  const menuActive = openMenu === item.id
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={`type-label transition-colors duration-200 ${navTextClass(
        isDark,
        routeActive || menuActive,
      )}`}
      aria-expanded={menuActive}
      aria-controls={`mega-menu-${item.id}`}
      onMouseEnter={() => open(item.id)}
      onFocus={() => open(item.id)}
      onClick={closeImmediately}
    >
      {item.label}
    </NavLink>
  )
}
