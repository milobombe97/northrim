import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandWordmark } from '../../components/BrandWordmark'
import { brand } from '../../config/brand'

export function AuthLayout({
  title,
  subtitle,
  children,
  step,
  onBack,
}: {
  title: string
  subtitle: string
  children: ReactNode
  step?: { current: number; total: number; label: string }
  onBack?: () => void
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0c1210] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/images/north-rim/signin.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210]/88 via-[#0c1210]/45 to-[#0c1210]/25" />
        <Link to="/" className="relative text-xl">
          <BrandWordmark />
        </Link>
        <div className="relative">
          <p className="max-w-sm font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-[-0.04em]">
            Everyday banking, with identity checks built in.
          </p>
          <p className="mt-4 max-w-sm text-white/90">
            Create a {brand.wordmark} account, then confirm who you are.
          </p>
        </div>
        <p className="relative text-sm text-white/80">{brand.wordmark}</p>
      </aside>

      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-5 lg:px-12">
          <Link to="/" className="text-lg lg:invisible">
            <BrandWordmark />
          </Link>
          <Link to="/" className="text-sm text-revolut-ink/60 hover:text-revolut-ink">
            Back to site
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-12">
          {onBack && (
            <button
              type="button"
              aria-label="Back"
              className="mb-6 grid size-10 place-items-center rounded-full border border-revolut-line text-revolut-ink hover:bg-revolut-muted"
              onClick={onBack}
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12.5 4.5 7 10l5.5 5.5" />
              </svg>
            </button>
          )}
          {step && (
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-revolut-ink/50">
                <span>{step.label}</span>
                <span>
                  {step.current} / {step.total}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-revolut-muted">
                <div
                  className="h-full rounded-full bg-revolut-ink transition-all"
                  style={{ width: `${(step.current / step.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-medium tracking-[-0.04em] text-revolut-ink">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-revolut-ink/65">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
