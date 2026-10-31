import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Button } from '../components/Button'
import { CookieBanner } from '../components/CookieBanner'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { FadeIn, Reveal } from '../components/Reveal'
import { SectionLead, SectionTitle } from '../components/Typography'
import { personalPlans } from '../data/plans'
import { PlansShowcase } from '../components/PlansCarousel'

const pillars = [
  {
    title: 'Regional roots',
    body: 'Accounts built for businesses and families who want a bank that understands mountain-west commerce.',
  },
  {
    title: 'Clear pricing',
    body: 'No teaser rates buried in footnotes. Everyday banking fees are stated upfront in your dashboard.',
  },
  {
    title: 'Human review',
    body: 'Large transfers and new payees pass through specialists — not bots alone.',
  },
]

const metrics = [
  { label: 'FDIC-insured partner network', value: 'Member banks' },
  { label: 'Support', value: '7 days · email & secure message' },
  { label: 'Domestic wires', value: 'Same-day cut-off 3pm MT' },
]

export function HomePage() {
  return (
    <div className="bg-[#f6f3ed] text-[#1c2420]">
      <section className="relative min-h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_70%_-10%,#2d4a3e_0%,#152019_55%,#0b100e_100%)]"
          aria-hidden
        />
        <div
          className="absolute -right-24 top-32 h-[420px] w-[420px] rounded-full bg-[#c9a962]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f6f3ed] to-transparent"
          aria-hidden
        />

        <Header theme="dark" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-32 lg:pt-32">
          <FadeIn className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c9a962]">
              {brand.legalName}
            </p>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.6rem,5.5vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.04em] text-white">
              Banking shaped for the long horizon
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/78">
              Open a secure account online, complete identity verification once, and manage balances,
              payments, and documents from one calm dashboard.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/signup">Start application</Button>
              <Button variant="secondary" href="/signin">
                Sign in
              </Button>
            </div>
            <p className="mt-8 text-sm text-white/50">
              {brand.publicUrl.replace('https://', '')} · Demo environment
            </p>
          </FadeIn>

          <FadeIn delay={0.15} className="relative">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md lg:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-white/60">Total balance</p>
                  <p className="mt-1 text-3xl font-medium tracking-tight text-white">$48,290.14</p>
                </div>
                <span className="rounded-full bg-[#c9a962]/20 px-3 py-1 text-xs font-medium text-[#e8d5a8]">
                  Active
                </span>
              </div>
              <ul className="mt-6 space-y-4">
                {[
                  { name: 'Operating · Checking', amount: '$31,004.02' },
                  { name: 'Reserve · Savings', amount: '$12,886.12' },
                  { name: 'Treasury · Money market', amount: '$4,400.00' },
                ].map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm"
                  >
                    <span className="text-white/75">{row.name}</span>
                    <span className="font-medium text-white">{row.amount}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className="mt-6 block rounded-xl bg-[#c9a962] py-3 text-center text-sm font-semibold text-[#1c2420] transition hover:bg-[#d4b872]"
              >
                View dashboard preview
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-[#d8d0c4] bg-[#f6f3ed] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:grid-cols-3 lg:px-8">
          {metrics.map((item) => (
            <Reveal key={item.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c6b62]">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-medium tracking-tight text-[#1c2420]">{item.value}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <SectionTitle>Why {brand.shortName}</SectionTitle>
            <SectionLead className="mt-4">
              {brand.legalName} pairs modern digital tools with conservative controls — so growth
              never outruns governance.
            </SectionLead>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 0.06}>
                <article className="h-full rounded-2xl border border-[#d8d0c4] bg-white p-8 shadow-sm">
                  <p className="text-sm font-semibold text-[#2d4a3e]">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-4 text-xl font-medium tracking-tight">{pillar.title}</h3>
                  <p className="mt-3 text-[#4a5650] leading-relaxed">{pillar.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2d4a3e] py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionTitle className="!text-white">Business &amp; personal, one relationship</SectionTitle>
            <SectionLead className="mt-6 !text-white/75">
              Switch between operating accounts, payroll-ready checking, and savings buckets without
              juggling multiple logins.
            </SectionLead>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/business">Business banking</Button>
              <Button variant="secondary" href="/accounts">
                Account types
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Payments', to: '/transfers' },
                { label: 'Cards', to: '/cards' },
                { label: 'Savings', to: '/savings' },
                { label: 'Security', to: '/security' },
              ].map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6 text-lg font-medium transition hover:bg-white/10"
                >
                  {label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <SectionTitle>Membership tiers</SectionTitle>
            <SectionLead className="mt-4 max-w-xl">
              Choose a plan that matches how you move money. Upgrade or downgrade anytime inside the app.
            </SectionLead>
          </Reveal>
          <div className="mt-12">
            <PlansShowcase plans={personalPlans} />
          </div>
          <div className="mt-8 text-center">
            <Link to="/plans" className="text-sm font-medium text-[#2d4a3e] underline-offset-4 hover:underline">
              Compare all plans
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8d0c4] bg-white py-20 text-center lg:py-24">
        <Reveal className="mx-auto max-w-xl px-5">
          <SectionTitle>Ready to open with {brand.legalName}?</SectionTitle>
          <p className="mt-4 text-[#4a5650]">
            Apply in minutes. We&apos;ll guide you through identity verification before your dashboard goes live.
          </p>
          <Button className="mt-8" href="/signup">
            Open an account
          </Button>
        </Reveal>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}
