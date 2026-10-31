import { Link } from 'react-router-dom'
import { Button } from './Button'

export type Plan = {
  name: string
  price: string
  period?: string
  description: string
  highlights: string[]
  href?: string
  featured?: boolean
}

export function PlansShowcase({ plans }: { plans: Plan[] }) {
  const featured = plans.find((plan) => plan.featured) ?? plans[plans.length - 1]
  const rest = plans.filter((plan) => plan !== featured)

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-12">
      <article className="flex flex-col rounded-[2rem] bg-revolut-ink p-7 text-white sm:p-8 lg:col-span-5">
        <p className="text-sm text-white/60">Subscription</p>
        <h3 className="mt-3 text-4xl font-medium tracking-[-0.04em]">{featured.name}</h3>
        <p className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-medium tracking-[-0.045em]">{featured.price}</span>
          {featured.period && <span className="text-white/60">{featured.period}</span>}
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{featured.description}</p>
        <ul className="mt-6 space-y-3 border-t border-white/15 pt-6 text-sm">
          {featured.highlights.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white" />
              {item}
            </li>
          ))}
        </ul>
        <Button href="/signup" variant="nav" className="mt-8 w-fit">
          Get {featured.name}
        </Button>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
        {rest.map((plan) => (
          <article key={plan.name} className="flex flex-col rounded-[1.5rem] border border-revolut-line bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-medium tracking-[-0.03em]">{plan.name}</h3>
              <p className="text-sm font-medium tabular-nums">
                {plan.price}
                {plan.period && <span className="font-normal text-revolut-ink/50">{plan.period}</span>}
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-revolut-ink/65">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-revolut-ink/80">
              {plan.highlights.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to={plan.href ?? '/plans'} className="mt-auto pt-5 text-sm font-medium underline-offset-4 hover:underline">
              See {plan.name}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export function PlansList({ plans }: { plans: Plan[] }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-revolut-line bg-white">
      {plans.map((plan) => (
        <article key={plan.name} className="grid gap-6 border-t border-revolut-line p-6 first:border-t-0 lg:grid-cols-[220px_1fr_auto] lg:items-center lg:p-8">
          <div>
            <h3 className="text-2xl font-medium tracking-[-0.03em]">{plan.name}</h3>
            <p className="mt-2 text-lg font-medium tabular-nums">
              {plan.price}
              {plan.period && <span className="text-sm font-normal text-revolut-ink/50">{plan.period}</span>}
            </p>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-revolut-ink/70">{plan.description}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {plan.highlights.map((item) => (
                <li key={item} className="text-sm text-revolut-ink/80">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Button href="/signup" variant={plan.featured ? 'primary' : 'secondary'}>
            Get {plan.name}
          </Button>
        </article>
      ))}
    </div>
  )
}
