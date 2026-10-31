import { MarketingSubPage } from '../MarketingSubPage'

export function CardsPage() {
  return (
    <MarketingSubPage
      eyebrow="Cards"
      title="Physical and virtual cards"
      lead="North Rim Inc cards sit on the account you already have. Limits, freeze, and the card design follow the subscription."
      heroTheme="dark"
      facts={[
        { label: 'Physical', value: 'One per plan' },
        { label: 'Virtual', value: 'For online spend' },
        { label: 'Freeze', value: 'Instant' },
        { label: 'Metal card', value: 'Metal plan' },
      ]}
      sections={[
        {
          kicker: 'Smart spending',
          title: 'What the cards menu covers',
          summary: 'Cards are the first item under Smart Spending. Points and shops stay on the spending page.',
          items: [
            { title: 'Physical cards', body: 'Standard through Ultra. Metal and Ultra are the plans with the heavier card and the travel benefits.' },
            { title: 'Virtual cards', body: 'A card number for online shops and subscriptions, created without waiting for plastic.' },
            { title: 'Controls', body: 'Freeze a card, set a limit, and read spend by category from the same account.' },
            { title: 'Plan perks', body: 'Purchase protection starts on Plus. Travel benefits start on Premium. The card itself does not change the posted balance.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
