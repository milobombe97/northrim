import { useCallback, useEffect, useRef, useState } from 'react'
import type { MegaMenuId } from '../data/megaMenu'

export type OpenMenu = MegaMenuId | 'kids' | null

const OPEN_DELAY_MS = 90
const CLOSE_DELAY_MS = 200

export function useMegaMenu() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }, [])

  const open = useCallback(
    (menu: OpenMenu) => {
      clearTimers()
      if (menu === 'kids') {
        setOpenMenu((current) => (current === 'kids' ? null : 'kids'))
        return
      }
      setOpenMenu((current) => (current === 'kids' ? null : current))
      openTimer.current = setTimeout(() => setOpenMenu(menu), OPEN_DELAY_MS)
    },
    [clearTimers],
  )

  const close = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS)
  }, [clearTimers])

  const closeImmediately = useCallback(() => {
    clearTimers()
    setOpenMenu(null)
  }, [clearTimers])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeImmediately()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeImmediately])

  useEffect(() => {
    document.body.style.overflow = openMenu && openMenu !== 'kids' ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [openMenu])

  return {
    openMenu,
    isMegaOpen: openMenu !== null && openMenu !== 'kids',
    open,
    close,
    closeImmediately,
    cancelClose,
  }
}
