import { useEffect, useState, type ReactNode } from 'react'

type ScrollHeaderProps = {
  theme: 'dark' | 'light'
  forceGlass?: boolean
  children: ReactNode
}

export function ScrollHeader({ theme, forceGlass = false, children }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = forceGlass || scrolled || theme === 'light'
  const bar = solid
    ? 'border-b border-black/5 bg-white/92 text-revolut-ink shadow-[0_1px_0_rgba(25,28,31,0.04)] backdrop-blur-xl'
    : 'text-white'

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={`group fixed inset-x-0 top-0 z-50 transition-[background,color,box-shadow] duration-300 ${bar}`}
    >
      {children}
    </header>
  )
}
