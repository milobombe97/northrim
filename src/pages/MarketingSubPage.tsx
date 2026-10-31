import { Button } from '../components/Button'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { DisplayTitle, SectionLead, SectionTitle } from '../components/Typography'

export type PageFact = { label: string; value: string }
export type PageItem = { title: string; body: string }
export type PageSection = {
  kicker: string
  title: string
  summary: string
  items: PageItem[]
}

export type MarketingSubPageProps = {
  eyebrow?: string
  title: string
  lead: string
  heroTheme?: 'dark' | 'light' | 'gradient'
  facts?: PageFact[]
  sections?: PageSection[]
  bullets?: string[]
  ctaLabel?: string
  ctaHref?: string
}

export function MarketingSubPage({
  eyebrow,
  title,
  lead,
  heroTheme = 'gradient',
  facts = [],
  sections = [],
  bullets = [],
  ctaLabel = 'Open an account',
  ctaHref = '/signup',
}: MarketingSubPageProps) {
  const heroClass =
    heroTheme === 'dark'
      ? 'bg-revolut-ink text-white'
      : heroTheme === 'light'
        ? 'bg-white text-revolut-ink'
        : 'bg-gradient-to-b from-[#9ec8ef] via-revolut-sky-hero to-[#6aa8de] text-white'

  const headerTheme = heroTheme === 'light' ? 'light' : 'dark'
  const onLight = heroTheme === 'light'

  return (
    <div className="bg-[#f3f4f5]">
      <section className={`relative pb-16 pt-24 lg:pb-20 lg:pt-28 ${heroClass}`}>
        <Header theme={headerTheme} />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {eyebrow && (
            <p className={`type-label uppercase tracking-[0.12em] ${onLight ? 'text-revolut-ink/50' : 'text-white/70'}`}>
              {eyebrow}
            </p>
          )}
          <DisplayTitle className={`mt-4 max-w-4xl ${onLight ? '!text-revolut-ink' : ''}`}>{title}</DisplayTitle>
          <SectionLead className={`mt-6 max-w-2xl ${onLight ? '!text-revolut-ink/70' : '!text-white/85'}`}>{lead}</SectionLead>
          <Button className="mt-10" href={ctaHref} variant={onLight ? 'primary' : 'nav'}>
            {ctaLabel}
          </Button>
        </div>
      </section>

      {facts.length > 0 && (
        <section className="border-b border-revolut-line bg-white">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="border-revolut-line px-5 py-6 odd:border-r lg:border-r lg:px-8 lg:last:border-r-0">
                <dt className="text-sm text-revolut-ink/55">{fact.label}</dt>
                <dd className="mt-2 text-xl font-medium tracking-[-0.03em] break-words">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {sections.map((section, index) => (
        <section key={section.title} className={index % 2 === 0 ? 'bg-white py-16 lg:py-20' : 'py-16 lg:py-20'}>
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:px-8">
            <div className="lg:sticky lg:top-24">
              <p className="type-label uppercase tracking-[0.12em] text-revolut-ink/45">{section.kicker}</p>
              <SectionTitle className="mt-3">{section.title}</SectionTitle>
              <p className="mt-4 max-w-md text-base leading-relaxed text-revolut-ink/70">{section.summary}</p>
            </div>
            <ol className="overflow-hidden rounded-[1.75rem] border border-revolut-line bg-white">
              {section.items.map((item, itemIndex) => (
                <li key={item.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-revolut-line px-5 py-5 first:border-t-0 sm:px-6">
                  <span className="pt-0.5 text-sm font-medium tabular-nums text-revolut-ink/35">
                    {String(itemIndex + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-revolut-ink/65">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}

      {sections.length === 0 && bullets.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionTitle>What you get</SectionTitle>
            <ul className="mt-8 overflow-hidden rounded-[1.75rem] border border-revolut-line bg-white">
              {bullets.map((item, index) => (
                <li key={item} className="border-t border-revolut-line px-6 py-5 first:border-t-0">
                  <span className="mr-3 text-sm tabular-nums text-revolut-ink/35">{String(index + 1).padStart(2, '0')}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
