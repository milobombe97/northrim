import type { PageFact, PageSection } from '../pages/MarketingSubPage'

export type Topic = {
  eyebrow: string
  title: string
  lead: string
  facts: PageFact[]
  sections: PageSection[]
  ctaLabel: string
  ctaHref: string
  heroTheme?: 'dark' | 'light' | 'gradient'
}

export const topics: Record<string, Topic> = {
  accounts: {
    eyebrow: 'Accounts',
    title: 'Accounts for how you hold money',
    lead: 'Personal, joint, and professional accounts from North Rim Inc Each one has its own balance, details, and activity.',
    facts: [
      { label: 'Account types', value: '3' },
      { label: 'Currencies', value: 'USD GBP EUR' },
      { label: 'Opening balance', value: '0' },
      { label: 'Bank', value: 'North Rim Inc' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'Pick the account that fits',
        summary: 'The Accounts menu covers everyday banking and the savings account that sits beside it.',
        items: [
          { title: 'Bank account', body: 'A personal account for salary, spending, and day-to-day transfers. Details can be copied from the dashboard.' },
          { title: 'Joint account', body: 'A shared view for two people. Activity stays on the account, with the same currencies as a personal account.' },
          { title: 'Professional account', body: 'Separated from personal spending so work payments and expenses are easier to follow.' },
          { title: 'Savings account', body: 'Instant Access Savings, paid daily. The rate shown in the app is variable and depends on the plan.' },
        ],
      },
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
  },
  transfers: {
    eyebrow: 'Transfers',
    title: 'Send, receive, and move money',
    lead: 'Transfers between your own North Rim Inc accounts post straight away. Sending outside the bank stays pending until it is reviewed.',
    facts: [
      { label: 'Own accounts', value: 'Instant' },
      { label: 'External send', value: 'Pending' },
      { label: 'Methods', value: 'By country' },
      { label: 'Receipts', value: 'When needed' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'How money leaves the account',
        summary: 'Send & Receive and International Transfers both land here. The method list follows the destination country.',
        items: [
          { title: 'Send & receive', body: 'Pay someone by name, or receive money into the account details on your dashboard.' },
          { title: 'International transfers', body: 'Choose the country first. The available methods change with that country, including bank transfer and local options.' },
          { title: 'Between your accounts', body: 'Moving USD to USD, or the same currency between your own accounts, does not wait for review.' },
          { title: 'Receipts', body: 'A payment that needs review can carry a receipt. Declined payments do not change the posted balance.' },
        ],
      },
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
    heroTheme: 'dark',
  },
  spend: {
    eyebrow: 'Spending',
    title: 'Spending, points, and linked accounts',
    lead: 'Money management, points, linked accounts, and shops sit next to the North Rim Inc balance so spending is easier to read.',
    facts: [
      { label: 'Cards', value: 'Physical + virtual' },
      { label: 'Points', value: 'On eligible spend' },
      { label: 'Linked accounts', value: 'In one view' },
      { label: 'Categories', value: 'From activity' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'What the spending menu covers',
        summary: 'Cards have their own page. The rest of Smart Spending is grouped here.',
        items: [
          { title: 'Money management', body: 'Balances, recent activity, and spending by category on the home dashboard.' },
          { title: 'Points', body: 'Points apply to eligible card spend. The rate follows the subscription you choose.' },
          { title: 'Linked accounts', body: 'See outside accounts beside North Rim Inc so the full picture is not split across apps.' },
          { title: 'Shops', body: 'Offers and partners that sit with the plan, separate from the posted account balance.' },
        ],
      },
    ],
    ctaLabel: 'See cards',
    ctaHref: '/cards',
  },
  travel: {
    eyebrow: 'Travel',
    title: 'Lounges and insurance',
    lead: 'Lounge access and travel cover are part of the paid North Rim Inc subscriptions. They are not included on Standard.',
    facts: [
      { label: 'Lounges', value: 'Metal and Ultra' },
      { label: 'Insurance', value: 'Paid plans' },
      { label: 'Spend abroad', value: 'Same account' },
      { label: 'Compare', value: 'On Plans' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'Travel benefits, by plan',
        summary: 'Global Finances sends lounges and insurance here. International transfers stay on the transfers page.',
        items: [
          { title: 'Lounges', body: 'Metal includes lounge access. Ultra extends that to unlimited visits. Standard, Plus, and Premium do not include lounges.' },
          { title: 'Insurance', body: 'Travel medical cover starts on Premium. Metal adds travel insurance. Ultra adds cancellation cover.' },
          { title: 'Spending abroad', body: 'You spend from the same account. Plus raises the overseas limit. Premium adds an unlimited exchange allowance.' },
          { title: 'Before you upgrade', body: 'The plans page lists the price and the benefits side by side so the difference is visible before you subscribe.' },
        ],
      },
    ],
    ctaLabel: 'Compare plans',
    ctaHref: '/plans',
    heroTheme: 'light',
  },
  crypto: {
    eyebrow: 'Crypto',
    title: 'Crypto next to everyday money',
    lead: 'North Rim Treasury and North Rim Exchange are the crypto views inside North Rim Inc This demo does not store live wallet keys.',
    facts: [
      { label: 'Ramp', value: 'Cash and crypto' },
      { label: 'North Rim Exchange', value: 'Exchange view' },
      { label: 'Send', value: 'A payment method' },
      { label: 'Keys', value: 'Not stored' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'The crypto menu',
        summary: 'Footer and business treasury both point at this page. It describes the demo flow, not a live exchange.',
        items: [
          { title: 'Crypto', body: 'Crypto can be chosen as a send or withdraw method when that option is available for the country.' },
          { title: 'North Rim Treasury', body: 'The on-ramp and off-ramp between the account balance and crypto. No live order is placed in this demo.' },
          { title: 'North Rim Exchange', body: 'The exchange view for prices and pairs. It sits beside the account instead of in a separate product.' },
          { title: 'What is not stored', body: 'Wallet keys, seed phrases, and exchange credentials are not saved in the browser or in the account profile.' },
        ],
      },
    ],
    ctaLabel: 'Open an account',
    ctaHref: '/signup',
    heroTheme: 'dark',
  },
  mobile: {
    eyebrow: 'Mobile',
    title: 'Mobile and data plans',
    lead: 'Connectivity from North Rim Inc sits with the same login as the bank account. Plans and data are chosen before anything is switched on.',
    facts: [
      { label: 'Mobile plans', value: 'Everyday' },
      { label: 'Data plans', value: 'Travel' },
      { label: 'Login', value: 'One account' },
      { label: 'Billing', value: 'With the plan' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'Connectivity, in two lines',
        summary: 'The footer groups mobile and data here. Ultra is the subscription that includes global data.',
        items: [
          { title: 'Mobile plans', body: 'A phone plan managed next to the account, with the price shown before you start.' },
          { title: 'Data plans', body: 'Travel data for a trip, separate from the everyday mobile plan.' },
          { title: 'Global data', body: 'Included with Ultra. The other subscriptions do not add a data allowance.' },
          { title: 'One login', body: 'The same North Rim Inc profile opens the account, the cards, and the connectivity plan.' },
        ],
      },
    ],
    ctaLabel: 'Compare plans',
    ctaHref: '/plans',
  },
  help: {
    eyebrow: 'Help',
    title: 'Contact, status, and the API',
    lead: 'Help from North Rim Inc covers the account, payments, and this demo. Support email is info@northrimbankinc.com.',
    facts: [
      { label: 'Support', value: 'info@northrimbankinc.com' },
      { label: 'Reviews', value: 'In the account' },
      { label: 'Status', value: 'Shown in app' },
      { label: 'API', value: 'Demo only' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'Where each help link goes',
        summary: 'Contact, the help centre, system status, and the developer note all use this page.',
        items: [
          { title: 'Contact us', body: 'Email info@northrimbankinc.com. Payment declines in the app also point to that address.' },
          { title: 'Help centre', body: 'Accounts, cards, transfers, identity checks, and subscriptions are explained on their own pages in this menu.' },
          { title: 'System status', body: 'A pending payment, an identity check, or a declined receipt shows its status on the account. There is no separate status board.' },
          { title: 'Developers API', body: 'The demo does not publish a public API key. Account data stays with the signed-in profile.' },
        ],
      },
    ],
    ctaLabel: 'Email support',
    ctaHref: 'mailto:info@northrimbankinc.com',
    heroTheme: 'light',
  },
  legal: {
    eyebrow: 'Legal',
    title: 'Terms, privacy, and complaints',
    lead: 'These notes describe the North Rim Inc demo. They are not a live bank agreement.',
    facts: [
      { label: 'Company', value: 'North Rim Inc' },
      { label: 'Year', value: '2026' },
      { label: 'Complaints', value: 'By email' },
      { label: 'Agreement', value: 'Demo only' },
    ],
    sections: [
      {
        kicker: 'In this menu',
        title: 'What the legal links cover',
        summary: 'Website terms, agreements, complaints, privacy, and the modern slavery policy share this page.',
        items: [
          { title: 'Website terms', body: 'The site is a design of North Rim Inc balances and payments. Nothing here moves real money.' },
          { title: 'Legal agreements', body: 'Opening an account in the demo creates a profile. It does not create a regulated account agreement.' },
          { title: 'Complaints', body: 'Send a complaint to info@northrimbankinc.com. The address is the same one shown on a declined payment.' },
          { title: 'Privacy', body: 'The demo stores the profile, identity files, and ledger for that account. It does not ask for a live card number.' },
          { title: 'UK Modern Slavery Policy', body: 'North Rim Inc states that this demo does not contract suppliers or labour. The policy contact is info@northrimbankinc.com.' },
        ],
      },
    ],
    ctaLabel: 'Contact support',
    ctaHref: 'mailto:info@northrimbankinc.com',
    heroTheme: 'light',
  },
}
