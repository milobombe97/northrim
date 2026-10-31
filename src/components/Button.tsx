import { type ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'nav'

const styles: Record<Variant, string> = {
  primary: 'bg-revolut-ink text-white hover:bg-black',
  secondary:
    'bg-white text-revolut-ink hover:bg-revolut-muted border border-revolut-line',
  ghost: 'bg-transparent text-white hover:bg-white/10 border border-transparent',
  nav: 'bg-white text-revolut-ink hover:bg-white shadow-[0_1px_2px_rgba(25,28,31,0.08)]',
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  href?: string
}

export function Button({
  variant = 'primary',
  className = '',
  href,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-revolut-ink active:scale-[0.98]'

  const classes = `${base} ${styles[variant]} ${className}`

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={classes}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
