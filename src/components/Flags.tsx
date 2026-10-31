import { useId } from 'react'

export function CurrencyFlag({
  currency,
  className = 'size-5',
}: {
  currency: string
  className?: string
}) {
  if (currency === 'EUR') return <EuFlag className={className} />
  if (currency === 'USD') return <UsFlag className={className} />
  return <GbFlag className={className} />
}

export function AccountMark({
  id,
  currency,
  className = 'size-5',
}: {
  id: string
  currency: string
  className?: string
}) {
  if (id === 'personal') return <AccountGlyph className={className} kind="personal" />
  if (id === 'savings') return <AccountGlyph className={className} kind="savings" />
  return <CurrencyFlag currency={currency} className={className} />
}

function AccountGlyph({ className, kind }: { className: string; kind: 'personal' | 'savings' }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-revolut-muted text-revolut-ink`}>
      <svg viewBox="0 0 20 20" className="size-[62%]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {kind === 'personal' ? (
          <>
            <circle cx="10" cy="7" r="2.3" />
            <path d="M4.8 16c.7-2.3 2.6-3.5 5.2-3.5s4.5 1.2 5.2 3.5" />
          </>
        ) : (
          <>
            <path d="M4 9.5h12v5.2a1.3 1.3 0 0 1-1.3 1.3H5.3A1.3 1.3 0 0 1 4 14.7V9.5Z" />
            <path d="M6.2 9.5V7.2A3.8 3.8 0 0 1 10 3.4a3.8 3.8 0 0 1 3.8 3.8v2.3" />
            <path d="M10 12.2v2" />
          </>
        )}
      </svg>
    </span>
  )
}

function FlagFrame({ className, children }: { className: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </svg>
  )
}

function EuFlag({ className }: { className: string }) {
  const stars = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2 - Math.PI / 2
    return (
      <circle
        key={index}
        cx={12 + Math.cos(angle) * 6.2}
        cy={12 + Math.sin(angle) * 6.2}
        r="0.85"
        fill="#FC0"
      />
    )
  })
  return (
    <FlagFrame className={className}>
      <circle cx="12" cy="12" r="12" fill="#003399" />
      {stars}
    </FlagFrame>
  )
}

function UsFlag({ className }: { className: string }) {
  const stripe = 24 / 13
  return (
    <FlagFrame className={className}>
      {Array.from({ length: 13 }, (_, index) => (
        <rect key={index} y={index * stripe} width="24" height={stripe + 0.2} fill={index % 2 ? '#fff' : '#B22234'} />
      ))}
      <rect width="11" height={stripe * 7} fill="#3C3B6E" />
    </FlagFrame>
  )
}

function GbFlag({ className }: { className: string }) {
  return (
    <FlagFrame className={className}>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0 L24 24 M24 0 L0 24" stroke="#fff" strokeWidth="5" />
      <path d="M0 0 L24 24 M24 0 L0 24" stroke="#C8102E" strokeWidth="2.2" />
      <path d="M12 0 V24 M0 12 H24" stroke="#fff" strokeWidth="8" />
      <path d="M12 0 V24 M0 12 H24" stroke="#C8102E" strokeWidth="4.4" />
    </FlagFrame>
  )
}
