import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { CookieBanner } from '../components/CookieBanner'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { FadeIn, Reveal } from '../components/Reveal'
import { personalPlans } from '../data/plans'
import { PlansShowcase } from '../components/PlansCarousel'

const photos = {
  hero: '/images/north-rim/hero.jpg',
  client: '/images/north-rim/client.jpg',
  card: '/images/north-rim/card-daylight.jpg',
  collab: '/images/north-rim/authorised-users.jpg',
  meeting: '/images/north-rim/business-review.jpg',
}

const assurances = [
  {
    label: 'Identity verification',
    detail: 'Applicants complete identity checks before the account can send payments.',
  },
  {
    label: 'Payment controls',
    detail: 'Transfers above the account threshold remain pending until an authorised user approves them.',
  },
  {
    label: 'Client support',
    detail: `Account correspondence is handled at ${brand.supportEmail}.`,
  },
]

export function HomePage() {
  return (
    <div className="bg-[#f7f4ef] text-[#14181f]">
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        <img
          src={photos.hero}
          alt="Glass towers in a financial district"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,18,16,0.82)_0%,rgba(12,18,16,0.5)_42%,rgba(12,18,16,0.12)_72%,rgba(12,18,16,0.04)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210]/45 via-transparent to-[#0c1210]/30" />

        <Header theme="dark" />

        <div className="relative mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:px-10">
            <FadeIn>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#e6c98a]">
                {brand.wordmark}
              </p>
              <h1 className="mt-5 max-w-[12ch] font-[family-name:var(--font-display)] text-[clamp(3.2rem,6.2vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.045em] text-white">
                Personal and business accounts
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/78">
                Current accounts, savings, and cards in USD, GBP, and EUR. Identity is confirmed before payments are released.
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
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Illustrative balance</p>
                <p className="mt-2 text-5xl font-medium tracking-[-0.04em]">$48,290</p>
                <p className="mt-1 text-sm text-white/65">Available across current and savings accounts</p>
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

      <section className="border-b border-[#14181f]/8 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 sm:grid-cols-3 lg:px-10">
          {assurances.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#8a7044]">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#14181f]/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2 lg:px-10">
          <Reveal>
            <img
              src={photos.client}
              alt="North Rim client in a bright office"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover object-top shadow-[0_30px_80px_-40px_rgba(20,24,31,0.7)]"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7044]">Personal banking</p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.035em]">
              Current accounts, savings, and cards
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#14181f]/70">
              Hold salary, reserves, and card spend on one profile. Balances are shown before a payment is submitted. Identity status is shown before a payment is released.
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
              Debit cards linked to your balances
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Physical and virtual cards draw on the accounts you hold. Freeze a card, set a spending limit, and review recurring charges from the dashboard.
            </p>
            <Link to="/cards" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f]">
              See cards
            </Link>
          </Reveal>
          <Reveal delay={0.08} className="order-1 lg:order-2">
            <img
              src={photos.card}
              alt="Card held beside a laptop in daylight"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover object-[42%_32%]"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f7f4ef] pb-6 pt-4">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-6 sm:grid-cols-2 lg:px-10">
          <Reveal>
            <figure className="relative overflow-hidden rounded-[2rem]">
              <img src={photos.collab} alt="Two account holders confirming an agreement" className="aspect-[5/4] w-full object-cover object-[center_40%]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c1210]/80 to-transparent px-6 pb-6 pt-16 text-sm font-medium text-white">
                Authorised users on one account
              </figcaption>
            </figure>
          </Reveal>
          <Reveal delay={0.08}>
            <figure className="relative min-h-[280px] overflow-hidden rounded-[2rem] text-white">
              <img src={photos.meeting} alt="Two colleagues reviewing an account at a table" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210]/88 via-[#0c1210]/42 to-[#0c1210]/10" />
              <figcaption className="relative flex h-full min-h-[320px] flex-col justify-end p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e6c98a]">Business</p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-[-0.035em]">
                  Business accounts with dual approval
                </h2>
                <p className="mt-4 max-w-md text-white/80">
                  Operating funds are held separately from personal balances. Payments above the set threshold remain pending until a second authorised user approves them.
                </p>
                <Link to="/business" className="mt-6 inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f]">
                  Business banking
                </Link>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f7f4ef] py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7044]">Account plans</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2rem,3.5vw,3rem)] font-medium tracking-[-0.035em]">
                Fees, limits, and card benefits
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
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#14181f]/60">
              Apply online. Identity verification is required before the account is opened.
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
