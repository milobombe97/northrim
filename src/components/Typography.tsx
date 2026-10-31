import { type ReactNode } from 'react'

type HeadingProps = {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function DisplayTitle({ children, className = '', as = 'h1' }: HeadingProps) {
  const Tag = as
  return (
    <Tag
      className={`type-display text-balance text-[clamp(2.75rem,7vw,5.25rem)] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, className = '', as = 'h2' }: HeadingProps) {
  const Tag = as
  return (
    <Tag
      className={`type-h2 text-balance text-[clamp(2rem,4.5vw,3.25rem)] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function SectionLead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`type-body-lg text-revolut-ink/70 ${className}`}>{children}</p>
}
