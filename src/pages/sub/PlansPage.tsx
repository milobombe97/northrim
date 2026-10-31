import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { PlansList } from '../../components/PlansCarousel'
import { DisplayTitle, SectionLead } from '../../components/Typography'
import { personalPlans } from '../../data/plans'

const included = [
  { label: 'Standard', detail: 'Accounts, cards, and local transfers' },
  { label: 'Plus', detail: 'Adds overseas limits and purchase protection' },
  { label: 'Premium', detail: 'Adds exchange allowance, savings, and medical cover' },
  { label: 'Metal', detail: 'Adds lounges, travel insurance, and a metal card' },
  { label: 'Ultra', detail: 'Adds unlimited lounges, global data, and cancellation cover' },
]

export function PlansPage() {
  return (
    <div className="bg-[#f3f4f5]">
      <section className="bg-white pb-14 pt-24 lg:pb-16 lg:pt-28">
        <Header theme="light" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="type-label uppercase tracking-[0.12em] text-revolut-ink/50">Subscriptions</p>
          <DisplayTitle className="mt-3 max-w-3xl !text-revolut-ink">Choose your plan</DisplayTitle>
          <SectionLead className="mt-6 max-w-2xl">
            Five North Rim Inc subscriptions. Each one keeps the accounts you already have and adds the benefits listed below.
          </SectionLead>
        </div>
      </section>

      <section className="border-y border-revolut-line bg-white">
        <dl className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-5">
          {included.map((item) => (
            <div key={item.label} className="border-t border-revolut-line px-5 py-5 sm:border-t-0 lg:border-r lg:px-6 lg:last:border-r-0">
              <dt className="font-medium">{item.label}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-revolut-ink/65">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <PlansList plans={personalPlans} />
        </div>
      </section>

      <Footer />
    </div>
  )
}
