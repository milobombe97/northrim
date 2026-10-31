import type { Plan } from '../components/PlansCarousel'

export const personalPlans: Plan[] = [
  {
    name: 'Standard',
    price: 'Free',
    description: 'Everyday banking with the accounts, cards, and transfers you actually use.',
    highlights: ['Personal account in USD, GBP, and EUR', 'Physical and virtual cards', 'Local transfers', 'Spending sorted by category'],
    href: '/plans',
  },
  {
    name: 'Plus',
    price: '£3.99',
    period: '/month',
    description: 'Higher limits for spending abroad, plus cover when a purchase goes wrong.',
    highlights: ['Higher overseas spending limits', 'Purchase protection', 'Priority in-app support', 'A better savings rate'],
    href: '/plans',
  },
  {
    name: 'Premium',
    price: '£8.99',
    period: '/month',
    description: 'Everyday extras: exchange allowance, savings, and travel medical cover.',
    highlights: ['Unlimited exchange allowance', 'Higher Instant Access rate', 'Travel medical cover', 'Partner subscriptions'],
    href: '/plans',
  },
  {
    name: 'Metal',
    price: '£16.99',
    period: '/month',
    description: 'Built for people who travel. Lounges, higher limits, and a metal card.',
    highlights: ['Lounge access', 'Travel insurance', 'Higher withdrawal limits', 'Subscriptions worth more than the fee'],
    href: '/plans',
  },
  {
    name: 'Ultra',
    price: '£60',
    period: '/month',
    description: 'The full set: unlimited lounges, global data, and cancellation cover.',
    highlights: ['Unlimited lounge access', 'Global data', 'Cancellation cover', 'Dedicated support'],
    href: '/plans',
    featured: true,
  },
]
