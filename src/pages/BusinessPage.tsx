import { MarketingSubPage } from './MarketingSubPage'

export function BusinessPage() {
  return (
    <MarketingSubPage
      eyebrow="North Rim Inc Business"
      title="Accounts, cards, and payments for a company"
      lead="North Rim Inc Business keeps company money, team spend, and customer payments in one account. Pricing sits with the plans page."
      heroTheme="dark"
      facts={[
        { label: 'Accounts', value: 'Multi-currency' },
        { label: 'Cards', value: 'For the team' },
        { label: 'Payments', value: 'Online and in person' },
        { label: 'Pricing', value: 'On Plans' },
      ]}
      sections={[
        {
          kicker: 'Essentials',
          title: 'The account the business runs on',
          summary: 'Multi-currency accounts, transfers, exchange, and FX forwards.',
          items: [
            { title: 'Multi-currency accounts', body: 'Hold USD, GBP, and EUR without opening a separate bank for each currency.' },
            { title: 'Transfers', body: 'Pay suppliers from the business account. External payments stay pending until North Rim Inc reviews them.' },
            { title: 'Exchange', body: 'Convert between the currencies on the account. Premium-style allowances are listed on the plans page.' },
            { title: 'FX forwards', body: 'Lock a rate for a later payment. The contract details are agreed before the payment is sent.' },
          ],
        },
        {
          kicker: 'Spend management',
          title: 'Cards and bills for the team',
          summary: 'Corporate cards, expenses, bills, and Titan.',
          items: [
            { title: 'Corporate cards', body: 'A card per person, with a limit set by the business rather than by the cardholder.' },
            { title: 'Expenses', body: 'Spend lands on the business account with a receipt, so it can be reviewed before it is treated as final.' },
            { title: 'Bills', body: 'Supplier bills stay in a list next to the balance instead of in a separate inbox.' },
            { title: 'Titan', body: 'The higher-control spend view for larger teams: limits, roles, and a clearer approval trail.' },
          ],
        },
        {
          kicker: 'Merchant',
          title: 'Getting paid',
          summary: 'Accept payments, the in-person store, online payments, and North Rim Pay.',
          items: [
            { title: 'Accept payments', body: 'Take a payment into the business account from a customer.' },
            { title: 'In-person store', body: 'A checkout for a counter or a market, settled into the same account.' },
            { title: 'Online payments', body: 'A checkout for a site or an invoice link.' },
            { title: 'North Rim Pay', body: 'The North Rim Inc button on a checkout, paid from a North Rim Inc account.' },
          ],
        },
        {
          kicker: 'Platform, treasury, resources',
          title: 'The rest of the business menu',
          summary: 'Reporting, APIs, savings, crypto, pricing, and help.',
          items: [
            { title: 'Analytics & reporting', body: 'Money in, money out, and unpaid bills on one report.' },
            { title: 'APIs and integrations', body: 'Connect the account to accounting tools. This demo does not issue a live API key.' },
            { title: 'Security & controls', body: 'Roles decide who can send, who can see cards, and who can approve a payment.' },
            { title: 'Savings and crypto', body: 'Treasury savings stay on the business account. Crypto uses the same crypto page as personal accounts.' },
            { title: 'Pricing and help', body: 'Business pricing is on the plans page. Customer help, customer stories, and guides come back to this page and to support@northrimbankinc.com.' },
          ],
        },
      ]}
      ctaLabel="Open a business account"
      ctaHref="/signup"
    />
  )
}
