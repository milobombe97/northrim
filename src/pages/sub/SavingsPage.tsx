import { MarketingSubPage } from '../MarketingSubPage'

export function SavingsPage() {
  return (
    <MarketingSubPage
      eyebrow="Savings"
      title="Instant Access Savings"
      lead="Set money aside with North Rim Inc and earn up to 4% AER variable, paid every day. The rate depends on the subscription."
      facts={[
        { label: 'Rate', value: 'Up to 4% AER' },
        { label: 'Interest', value: 'Paid daily' },
        { label: 'Access', value: 'Instant' },
        { label: 'Rate type', value: 'Variable' },
      ]}
      sections={[
        {
          kicker: 'Savings account',
          title: 'How the savings account works',
          summary: 'The Accounts menu links Savings here. Goals on the home page use the same account.',
          items: [
            { title: 'Instant access', body: 'Money can move back to the personal account without a notice period.' },
            { title: 'Daily interest', body: 'Interest is calculated daily. The posted rate is variable and can change.' },
            { title: 'Goals', body: 'Adventure, wedding, and moving goals are labels on the same savings balance, not separate products.' },
            { title: 'Plan rates', body: 'Plus, Premium, Metal, and Ultra can show a higher rate than Standard. The plans page lists the subscription prices.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
