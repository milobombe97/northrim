import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Button } from '../components/Button'
import { CookieBanner } from '../components/CookieBanner'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { FadeIn, Reveal } from '../components/Reveal'
import { personalPlans } from '../data/plans'
import { PlansShowcase } from '../components/PlansCarousel'

const steps = [
  { step: '01', title: 'Apply online', body: 'Tell us about you or your business in a guided flow.' },
  { step: '02', title: 'Verify identity', body: 'Upload documents once; our team reviews every submission.' },
  { step: '03', title: 'Use your dashboard', body: 'Move money, request payments, and track activity in one place.' },
]

const bento = [
  {
    title: 'Checking & savings',
    body: 'Separate buckets for operating cash and reserves, with balances in USD, GBP, or EUR.',
    to: '/accounts',
    span: 'lg:col-span-2',
  },
  {
    title: 'Cards',
    body: 'Virtual and physical cards tied to the accounts you already use.',
    to: '/cards',
    span: '',
  },
  {
    title: 'Verified payments',
    body: 'Send to other North Rim Inc customers or pay external parties with full details.',
    to: '/transfers',
    span: '',
  },
  {
    title: 'Business tools',
    body: 'Team access, payout methods, and admin review for high-value transfers.',
    to: '/business',
    span: 'lg:col-span-2',
  },
]

function RidgePattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      aria-hidden
      preserveAspectRatio="none"
      viewBox="0 0 1200 600"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        d="M0 420 Q200 320 400 380 T800 340 T1200 400"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        d="M0 480 Q250 400 500 460 T1000 420 T1200 460"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        d="M0 520 Q300 460 600 500 T1200 520"
      />
    </svg>
  )
}

export function HomePage() {
  return (
    <div className="bg-[#faf8f5] text-[#0f1c2e]">
      <section className="relative overflow-hidden border-b border-[#0f1c2e]/10">
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#faf8f5_0%,#eef1f6_45%,#e3e9f0_100%)]" />
        <RidgePattern />

        <Header theme="light" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <FadeIn>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0f1c2e]/15 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f1c2e]/70 backdrop-blur-sm">
                Member-led digital banking
              </p>
              <h1 className="mt-8 font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[#0f1c2e]">
                {brand.wordmark}
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-relaxed text-[#0f1c2e]/72">
                Secure accounts, thoughtful verification, and a dashboard built for people who
                expect clarity—not clutter—from their bank.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button href="/signup">Open an account</Button>
                <Button
                  variant="secondary"
                  href="/signin"
                  className="border-[#0f1c2e]/15 bg-white/80"
                >
                  Sign in
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="lg:pb-4">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0f1c2e] p-8 text-white shadow-[0_24px_60px_-20px_rgba(15,28,46,0.45)]">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#b87333]/30 blur-2xl" aria-hidden />
                <p className="text-sm text-white/60">At a glance</p>
                <dl className="mt-6 space-y-5">
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
                    <dt className="text-white/70">Combined balance</dt>
                    <dd className="text-2xl font-medium tabular-nums">$48,290.14</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <dt className="text-white/60">Pending review</dt>
                    <dd className="font-medium text-[#e8c9a0]">2 payments</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-sm">
                    <dt className="text-white/60">Identity</dt>
                    <dd className="font-medium text-emerald-300/90">Verified</dd>
                  </div>
                </dl>
                <Link
                  to="/dashboard"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#b87333] py-3 text-sm font-semibold text-white transition hover:bg-[#c98442]"
                >
                  Go to dashboard
                </Link>
                <p className="mt-4 text-center text-xs text-white/45">Demo figures · {brand.domain}</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-3 lg:px-8">
          {[
            { k: 'Accounts', v: 'Personal, joint & business' },
            { k: 'Coverage', v: 'Partner bank network' },
            { k: 'Support', v: brand.supportEmail },
          ].map((row) => (
            <Reveal key={row.k}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f1c2e]/45">
                {row.k}
              </p>
              <p className="mt-2 text-lg font-medium text-[#0f1c2e]">{row.v}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-[#0f1c2e]/10 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]">
              How {brand.wordmark} works
            </h2>
            <p className="mt-4 text-lg text-[#0f1c2e]/65">
              Three steps from application to everyday banking—each one visible in your account
              status.
            </p>
          </Reveal>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.05}>
                <li className="relative pl-0 md:pl-6 md:border-l md:border-[#0f1c2e]/10">
                  <span className="text-sm font-bold text-[#b87333]">{item.step}</span>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[#0f1c2e]/65 leading-relaxed">{item.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.03em]">
              Built for how you actually bank
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bento.map((tile, i) => (
              <Reveal key={tile.title} delay={i * 0.04} className={tile.span}>
                <Link
                  to={tile.to}
                  className={`group flex h-full flex-col justify-between rounded-2xl border border-[#0f1c2e]/10 bg-white p-8 shadow-sm transition hover:border-[#b87333]/40 hover:shadow-md ${tile.span}`}
                >
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight group-hover:text-[#b87333]">
                      {tile.title}
                    </h3>
                    <p className="mt-3 text-[#0f1c2e]/65 leading-relaxed">{tile.body}</p>
                  </div>
                  <span className="mt-6 text-sm font-medium text-[#0f1c2e] group-hover:underline">
                    Learn more →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f1c2e] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.03em]">
                Plans from {brand.wordmark}
              </h2>
              <p className="mt-3 max-w-lg text-white/70">
                Start with Standard and add perks as your relationship grows. Change plans anytime in
                settings.
              </p>
            </div>
            <Link to="/plans" className="text-sm font-medium text-[#e8c9a0] hover:underline">
              Compare all plans
            </Link>
          </Reveal>
          <div className="mt-12 [&_*]:text-inherit">
            <PlansShowcase plans={personalPlans} />
          </div>
        </div>
      </section>

      <section className="py-20 text-center lg:py-24">
        <Reveal className="mx-auto max-w-lg px-5">
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.03em]">
            Banking with {brand.wordmark}
          </h2>
          <p className="mt-4 text-[#0f1c2e]/65">
            Join in minutes. Your data stays with our dedicated platform—not shared with other brands.
          </p>
          <Button className="mt-8 bg-[#0f1c2e] hover:bg-black" href="/signup">
            Get started
          </Button>
        </Reveal>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}
