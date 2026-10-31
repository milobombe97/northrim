import { Link } from 'react-router-dom'
import { brand } from '../config/brand'

const linkColumns = [
  {
    title: 'Crypto',
    links: [
      { label: 'Crypto', to: '/crypto' },
      { label: 'North Rim Treasury', to: '/crypto' },
      { label: 'North Rim Exchange', to: '/crypto' },
    ],
  },
  {
    title: 'Mobile & Connectivity',
    links: [
      { label: 'Mobile Plans', to: '/mobile' },
      { label: 'Data Plans', to: '/mobile' },
    ],
  },
  {
    title: 'Investments',
    links: [
      { label: 'Stocks', to: '/invest' },
      { label: 'Stocks & Shares ISA', to: '/invest' },
      { label: 'Commodities', to: '/invest' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Contact Us', to: '/help' },
      { label: 'Help Centre', to: '/help' },
      { label: 'System Status', to: '/help' },
      { label: 'Developers API', to: '/help' },
    ],
  },
  {
    title: 'Plans',
    links: [
      { label: 'Standard', to: '/plans' },
      { label: 'Plus', to: '/plans' },
      { label: 'Premium', to: '/plans' },
      { label: 'Metal', to: '/plans' },
      { label: 'Ultra', to: '/plans' },
      { label: 'Compare Plans', to: '/plans' },
    ],
  },
  {
    title: 'Accounts',
    links: [
      { label: 'Bank Account', to: '/accounts' },
      { label: 'Joint Account', to: '/accounts' },
      { label: 'Savings Account', to: '/savings' },
      { label: 'Cards', to: '/cards' },
    ],
  },
]

const legalLinks = [
  { label: 'Website Terms', to: '/legal' },
  { label: 'Legal Agreements', to: '/legal' },
  { label: 'Complaints', to: '/legal' },
  { label: 'Privacy', to: '/legal' },
  { label: 'UK Modern Slavery Policy', to: '/legal' },
]

export function Footer() {
  return (
    <footer className="border-t border-revolut-line bg-revolut-muted">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h2 className="type-label text-revolut-ink">{col.title}</h2>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-revolut-ink/65 transition-colors hover:text-revolut-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-revolut-line pt-10 text-sm text-revolut-ink/65">
          <p className="font-medium text-revolut-ink">© {brand.legalName} 2026. All rights reserved.</p>
          <p className="max-w-4xl leading-relaxed">
            Everyday banking, savings, cards, and payments from {brand.legalName}.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="hover:text-revolut-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
