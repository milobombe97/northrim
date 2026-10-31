import { MarketingSubPage } from './MarketingSubPage'

export function CompanyPage() {
  return (
    <MarketingSubPage
      eyebrow="Company"
      title="North Rim Inc"
      lead="North Rim Inc builds the account, the cards, and the payments on this site. The company menu is the short version of who that is."
      heroTheme="light"
      facts={[
        { label: 'Customers', value: '80M+' },
        { label: 'Countries', value: '45+' },
        { label: 'People', value: '10K+' },
        { label: 'Founded as', value: 'North Rim Inc' },
      ]}
      sections={[
        {
          kicker: 'Company',
          title: 'About, sustainability, and conduct',
          summary: 'Three items in the company column. Help and the developer note live on the help page.',
          items: [
            { title: 'About North Rim Inc', body: 'The company started so people could hold, send, and spend money in one account, with the fee written down before they subscribe.' },
            { title: 'Sustainability', body: 'Progress on carbon, inclusion, and product design is published with the company, not buried in a footer link that goes nowhere.' },
            { title: 'Code of conduct', body: 'Staff and the product follow the same rule: do not ask a customer for a password by email, and do not post a payment that was declined.' },
            { title: 'Careers', body: 'Roles are sent through info@northrimbankinc.com. This demo does not list open jobs.' },
          ],
        },
      ]}
      ctaLabel="Contact North Rim Inc"
      ctaHref="/help"
    />
  )
}
