import { images } from './images'

export type TrustBadge = {
  label: string
  image?: string
}

export const trustBadges: TrustBadge[] = [
  { label: '#3 most downloaded finance app' },
  { label: '4.7 out of 5 on Trustpilot', image: images.badgeTrustpilot },
  { label: "World's Best Digital Bank", image: images.badgeDigitalBank },
  { label: "World's Best Banks List" },
  { label: 'Best International Payments Provider 2025' },
  { label: 'Customer Satisfaction — Gold' },
  { label: 'Consumer Guardian Badge 2025' },
]
