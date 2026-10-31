import { type CSSProperties, type ReactNode } from 'react'
import type { TrustBadge } from '../data/badges'

type MarqueeProps = {
  children: ReactNode
  duration?: string
  className?: string
}

export function Marquee({ children, duration = '45s', className = '' }: MarqueeProps) {
  return (
    <div className={`marquee-mask overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        style={{ '--marquee-duration': duration } as CSSProperties}
      >
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden>{children}</div>
      </div>
    </div>
  )
}

export function BadgeCard({ label }: TrustBadge) {
  return (
    <div className="flex min-h-[72px] min-w-[260px] items-center justify-center rounded-2xl border border-revolut-line bg-white px-7 py-4 text-center">
      <span className="text-sm font-medium leading-snug tracking-[-0.01em] text-revolut-ink">
        {label}
      </span>
    </div>
  )
}
