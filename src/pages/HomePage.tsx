import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { CookieBanner } from '../components/CookieBanner'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { FadeIn, Reveal } from '../components/Reveal'
import { personalPlans } from '../data/plans'
import { PlansShowcase } from '../components/PlansCarousel'

const photos = {
  canyon: '/images/north-rim/canyon.jpg',
  portrait: '/images/north-rim/portrait.jpg',
  card: '/images/north-rim/card.jpg',
  interior: '/images/north-rim/interior.jpg',
}

export function HomePage() {
  return (
    <div className="bg-[#f7f4ef] text-[#14181f]">
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <img
          src={photos.canyon}
          alt="Sandstone canyon in warm light"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,18,16,0.88)_0%,rgba(12,18,16,0.62)_38%,rgba(12,18,16,0.18)_68%,rgba(12,18,16,0.05)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210]/45 via-transparent to-[#0c1210]/30" />

        <Header theme="dark" />

        <div className="relative mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:px-10">
            <FadeIn>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#e6c98a]">
                {brand.wordmark}
              </p>
              <h1 className="mt-5 max-w-[11ch] font-[family-name:var(--font-display)] text-[clamp(3.2rem,6.2vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.045em] text-white">
                Banking with a longer view
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/78">
                Accounts, cards, and reviewed payments for people who want a bank that looks as considered as the money it holds.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f] transition hover:bg-[#f7f4ef]"
                >
                  Open an account
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex rounded-full border border-white/35 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <article className="rounded-3xl border border-white/20 bg-[#0c1210]/72 p-7 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Personal</p>
                <p className="mt-2 text-5xl font-medium tracking-[-0.04em]">$48,290</p>
                <p className="mt-1 text-sm text-white/65">Available across your accounts</p>
                <Link
                  to="/accounts"
                  className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-[#14181f]"
                >
                  View accounts
                </Link>
              </article>
            </FadeIn>
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <img
              src={photos.portrait}
              alt="Client at a city window"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-[0_30px_80px_-40px_rgba(20,24,31,0.7)]"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7044]">Everyday money</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Salary, savings, and spend in one relationship
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#14181f]/70">
              {brand.wordmark} keeps operating cash, reserves, and cards on the same profile. You see balances before you move them, and identity status before a payment is allowed through.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex rounded-full bg-[#14181f] px-6 py-3 text-sm font-medium text-white">
                Open an account
              </Link>
              <Link to="/savings" className="inline-flex rounded-full border border-[#14181f]/15 px-6 py-3 text-sm font-medium">
                Explore savings
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#14181f] text-white">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <Reveal className="order-2 lg:order-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e6c98a]">Cards</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              A card that belongs to the account
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Physical and virtual cards draw from the balances you already hold. Freeze a card, set a limit, and keep subscriptions visible from the dashboard.
            </p>
            <Link to="/cards" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f]">
              See cards
            </Link>
          </Reveal>
          <Reveal delay={0.08} className="order-1 lg:order-2">
            <img
              src={photos.card}
              alt="Hands holding a payment card beside a laptop"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover"
            />
          </Reveal>
        </div>
      </section>

      <section className="relative min-h-[560px] overflow-hidden text-white">
        <img
          src={photos.interior}
          alt="Quiet modern office interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#14181f]/62" />
        <div className="relative mx-auto flex min-h-[560px] max-w-[1280px] items-end px-6 py-16 lg:px-10">
          <Reveal className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e6c98a]">Business</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Room for the company account
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/78">
              Operating funds, payouts, and staff review sit beside personal banking. Large movements stay pending until someone on your team approves them.
            </p>
            <Link to="/business" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f]">
              Business banking
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7044]">Membership</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,3.5vw,3rem)] font-medium tracking-[-0.035em]">
                Plans that stay readable
              </h2>
            </div>
            <Link to="/plans" className="text-sm underline-offset-4 hover:underline">
              Compare plans
            </Link>
          </Reveal>
          <div className="mt-12">
            <PlansShowcase plans={personalPlans} />
          </div>
        </div>
      </section>

      <section className="border-t border-[#14181f]/10 bg-white py-16">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-[-0.035em]">
              {brand.wordmark}
            </h2>
            <p className="mt-2 text-sm text-[#14181f]/60">
              Photography from Unsplash. Apply online, then complete identity verification.
            </p>
          </div>
          <Link to="/signup" className="inline-flex rounded-full bg-[#14181f] px-7 py-3 text-sm font-medium text-white">
            Start application
          </Link>
        </div>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  )
}
