import { MarketingSubPage } from '../MarketingSubPage'

export function AirPage() {
  return (
    <MarketingSubPage
      eyebrow="North Rim AI"
      title="AIR, the assistant in the account"
      lead="AIR is the North Rim Inc assistant for questions about spending, travel, and the plan you are on. It does not move money by itself."
      facts={[
        { label: 'Product', value: 'AIR' },
        { label: 'Hours', value: '24/7' },
        { label: 'Moves money', value: 'No' },
        { label: 'Lives in', value: 'The account' },
      ]}
      sections={[
        {
          kicker: 'North Rim AI',
          title: 'What AIR is for',
          summary: 'The menu has one item, AIR. These are the jobs it is meant to cover.',
          items: [
            { title: 'Ask in plain language', body: 'Questions about a balance, a category, or a trip can be asked without hunting through settings.' },
            { title: 'Uses your activity', body: 'Answers can refer to the accounts and spending already on the profile. They stay on that profile.' },
            { title: 'Always available', body: 'AIR does not use support opening hours. Account reviews and payment approvals are still done by North Rim Inc staff.' },
            { title: 'Limits', body: 'AIR does not approve a payment, change a subscription, or submit an identity check.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
