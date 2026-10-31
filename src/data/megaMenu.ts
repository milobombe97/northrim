export type MenuLink = {
  label: string
  to: string
  description?: string
}

export type MenuColumn = {
  title: string
  links: MenuLink[]
}

export type MegaMenuConfig = {
  id: 'personal' | 'business' | 'company'
  featured?: {
    title: string
    description: string
    to: string
    imageKey: string
  }
  columns: MenuColumn[]
}

export type KidsMenuItem = MenuLink

export const personalMegaMenu: MegaMenuConfig = {
  id: 'personal',
  featured: {
    title: 'Discover North Rim Inc',
    description: 'Banking, savings, cards, and global payments in one app.',
    to: '/',
    imageKey: 'salary',
  },
  columns: [
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
        { label: 'Professional Account', to: '/accounts' },
        { label: 'Savings Account', to: '/savings' },
      ],
    },
    {
      title: 'Smart Spending',
      links: [
        { label: 'Cards', to: '/cards' },
        { label: 'Send & Receive', to: '/transfers' },
        { label: 'Money Management', to: '/spend' },
        { label: 'Points', to: '/spend' },
        { label: 'Linked Accounts', to: '/spend' },
        { label: 'Shops', to: '/spend' },
      ],
    },
    {
      title: 'Global Finances',
      links: [
        { label: 'International Transfers', to: '/transfers' },
        { label: 'Lounges', to: '/travel' },
        { label: 'Insurance', to: '/travel' },
      ],
    },
    {
      title: 'North Rim AI',
      links: [{ label: 'AIR', to: '/air' }],
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
      title: 'Security & Protection',
      links: [
        { label: 'How We Protect Your Money', to: '/security' },
        { label: 'Learn About Fraud & Scams', to: '/security' },
        { label: 'Report Lost Device', to: '/security' },
      ],
    },
  ],
}

export const businessMegaMenu: MegaMenuConfig = {
  id: 'business',
  featured: {
    title: 'North Rim Inc Business',
    description: 'Accounts, cards, and payments built for growing companies.',
    to: '/business',
    imageKey: 'menuBusiness',
  },
  columns: [
    {
      title: 'Essentials',
      links: [
        { label: 'Multi-currency accounts', to: '/business' },
        { label: 'Transfers', to: '/business' },
        { label: 'Exchange', to: '/business' },
        { label: 'FX Forwards', to: '/business' },
      ],
    },
    {
      title: 'Spend management',
      links: [
        { label: 'Corporate cards', to: '/business' },
        { label: 'Expenses', to: '/business' },
        { label: 'Bills', to: '/business' },
        { label: 'Titan', to: '/business' },
      ],
    },
    {
      title: 'Merchant',
      links: [
        { label: 'Accept payments', to: '/business' },
        { label: 'In-person store', to: '/business' },
        { label: 'Online Payments', to: '/business' },
        { label: 'North Rim Pay', to: '/business' },
      ],
    },
    {
      title: 'Platform',
      links: [
        { label: 'Analytics & reporting', to: '/business' },
        { label: 'APIs', to: '/business' },
        { label: 'Integrations', to: '/business' },
        { label: 'Security & controls', to: '/business' },
      ],
    },
    {
      title: 'Treasury',
      links: [
        { label: 'Savings', to: '/business' },
        { label: 'Crypto', to: '/crypto' },
      ],
    },
    {
      title: 'Plans',
      links: [
        { label: 'Business pricing', to: '/plans' },
        { label: 'Payment Acceptance Pricing', to: '/business' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Customer Help', to: '/business' },
        { label: 'Customers', to: '/business' },
        { label: 'Guides', to: '/business' },
      ],
    },
  ],
}

export const companyMegaMenu: MegaMenuConfig = {
  id: 'company',
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'About North Rim Inc', to: '/company' },
        { label: 'Sustainability', to: '/company' },
        { label: 'Code of Conduct', to: '/company' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Contact Us', to: '/help' },
        { label: 'Help Centre', to: '/help' },
        { label: 'System Status', to: '/help' },
      ],
    },
    {
      title: 'Developers',
      links: [{ label: 'Developers API', to: '/help' }],
    },
  ],
}

export const kidsMenuItems: KidsMenuItem[] = [
  { label: 'For ages 6–15', to: '/kids-teens' },
  { label: 'For ages 16–17', to: '/kids-teens' },
  { label: 'Parents and guardians', to: '/kids-teens' },
  { label: 'Help Center', to: '/kids-teens' },
]

export const megaMenus = {
  personal: personalMegaMenu,
  business: businessMegaMenu,
  company: companyMegaMenu,
}

export type MegaMenuId = keyof typeof megaMenus
