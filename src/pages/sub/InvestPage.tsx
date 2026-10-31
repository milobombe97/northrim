import { MarketingSubPage } from '../MarketingSubPage'

export function InvestPage() {
  return (
    <MarketingSubPage
      eyebrow="Investments"
      title="Stocks, an ISA, and commodities"
      lead="North Rim Inc lists stocks and ETFs for an execution-only view. Capital is at risk. This demo does not place live orders."
      heroTheme="light"
      facts={[
        { label: 'Range', value: '5,000+ names' },
        { label: 'Commission', value: 'Inside allowance' },
        { label: 'Advice', value: 'None' },
        { label: 'Risk', value: 'Capital at risk' },
      ]}
      sections={[
        {
          kicker: 'In this menu',
          title: 'Three investment lines',
          summary: 'Stocks, the Stocks & Shares ISA, and commodities share this page. Other fees can apply outside the monthly allowance.',
          items: [
            { title: 'Stocks', body: 'Shares and ETFs in one list, from large listed companies. Trades inside the monthly allowance are shown as commission-free.' },
            { title: 'Stocks & Shares ISA', body: 'A UK tax wrapper around the same investments. Availability follows the account country.' },
            { title: 'Commodities', body: 'A separate list from company shares, with the same risk note: the value can fall.' },
            { title: 'What this is not', body: 'North Rim Inc does not give personal investment advice here. The page is execution-only information.' },
          ],
        },
      ]}
      ctaLabel="Open an account"
      ctaHref="/signup"
    />
  )
}
