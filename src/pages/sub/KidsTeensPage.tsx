import { MarketingSubPage } from '../MarketingSubPage'

export function KidsTeensPage() {
  return (
    <MarketingSubPage
      eyebrow="Kids & Teens"
      title="Accounts for 6–17, with a parent in view"
      lead="North Rim Inc splits kids and teens by age. A parent or guardian stays on the account until the young person can hold one alone."
      heroTheme="light"
      facts={[
        { label: 'Younger', value: 'Ages 6–15' },
        { label: 'Teens', value: 'Ages 16–17' },
        { label: 'Adult account', value: 'From 18' },
        { label: 'Control', value: 'Parent or guardian' },
      ]}
      sections={[
        {
          kicker: 'In this menu',
          title: 'Four entries, one account family',
          summary: 'Every item in the Kids & Teens menu is described below. An adult North Rim Inc account still starts at 18.',
          items: [
            { title: 'For ages 6–15', body: 'A card and an allowance the parent can see. Spending limits are set by the adult, not by the child.' },
            { title: 'For ages 16–17', body: 'A teen account with more day-to-day use, still linked to a parent or guardian.' },
            { title: 'Parents and guardians', body: 'The adult sees the balance, the card, and the goals. They can pause the card from their own login.' },
            { title: 'Help center', body: 'Questions about a youth account go to info@northrimbankinc.com, the same address as the main help page.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
