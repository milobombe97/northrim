import { MarketingSubPage } from '../MarketingSubPage'

export function SecurityPage() {
  return (
    <MarketingSubPage
      eyebrow="North Rim Inc Secure"
      title="How the account is protected"
      lead="North Rim Inc Secure is the set of controls on the account: fraud checks, a card freeze, and a way to report a lost device."
      heroTheme="dark"
      facts={[
        { label: 'Monitoring', value: '24/7' },
        { label: 'Card freeze', value: 'In the app' },
        { label: 'Lost device', value: 'Report here' },
        { label: 'Support', value: 'support@northrimbankinc.com' },
      ]}
      sections={[
        {
          kicker: 'Security & protection',
          title: 'The three security links',
          summary: 'Each item in the Security & Protection menu is a section of this page.',
          items: [
            { title: 'How we protect your money', body: 'Posted balances change only when a payment is approved or an internal transfer completes. Pending and declined rows stay visible and do not post.' },
            { title: 'Learn about fraud & scams', body: 'Unexpected payment requests and identity asks should be checked in the account first. North Rim Inc does not ask for a password by email.' },
            { title: 'Report a lost device', body: 'Freeze the card from the cards page, then email support@northrimbankinc.com from a device you still control.' },
            { title: 'Identity checks', body: 'A new account stays limited until the identity check is approved. A rejection includes a reason and a way to send it again.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
