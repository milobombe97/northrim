export type PayoutMethod = {
  id: string
  label: string
  detail: string
}

const bank: PayoutMethod = {
  id: 'bank',
  label: 'Bank transfer',
  detail: 'Send to a local bank account',
}
const apple: PayoutMethod = {
  id: 'apple',
  label: 'Apple Pay',
  detail: 'Send to an Apple Pay wallet',
}
const google: PayoutMethod = {
  id: 'google',
  label: 'Google Pay',
  detail: 'Send to a Google Pay wallet',
}
const crypto: PayoutMethod = {
  id: 'crypto',
  label: 'Crypto',
  detail: 'Send or withdraw in crypto',
}
const sepa: PayoutMethod = { id: 'sepa', label: 'SEPA', detail: 'Euro transfer inside Europe' }
const fps: PayoutMethod = { id: 'fps', label: 'Faster Payments', detail: 'UK bank transfer' }
const ach: PayoutMethod = { id: 'ach', label: 'ACH', detail: 'US bank transfer' }
const zelle: PayoutMethod = { id: 'zelle', label: 'Zelle', detail: 'US bank-to-bank' }
const chime: PayoutMethod = { id: 'chime', label: 'Chime', detail: 'US Chime account' }
const interac: PayoutMethod = { id: 'interac', label: 'Interac', detail: 'Canadian transfer' }
const etransfer: PayoutMethod = { id: 'etransfer', label: 'E-transfer', detail: 'Interac e-Transfer' }
const pix: PayoutMethod = { id: 'pix', label: 'Pix', detail: 'Brazilian instant payment' }
const upi: PayoutMethod = { id: 'upi', label: 'UPI', detail: 'Indian instant payment' }
const payid: PayoutMethod = { id: 'payid', label: 'PayID', detail: 'Australian bank payment' }

const sepaCountries = new Set([
  'Andorra',
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Monaco',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'San Marino',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Vatican City',
])

const walletCountries = new Set([
  ...sepaCountries,
  'Australia',
  'Brazil',
  'Canada',
  'Hong Kong',
  'Israel',
  'Japan',
  'Malaysia',
  'Mexico',
  'New Zealand',
  'Qatar',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Taiwan',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
])

export function methodsForCountry(country: string): PayoutMethod[] {
  const methods: PayoutMethod[] = []
  if (country === 'United Kingdom') methods.push(fps)
  if (sepaCountries.has(country)) methods.push(sepa)
  if (country === 'United States') methods.push(ach, zelle, chime)
  if (country === 'Canada') methods.push(interac, etransfer)
  if (country === 'Brazil') methods.push(pix)
  if (country === 'India') methods.push(upi, google)
  if (country === 'Australia') methods.push(payid)
  methods.push(bank)
  if (walletCountries.has(country)) methods.push(apple, google)
  if (country !== 'China' && country !== 'North Korea') methods.push(crypto)
  return methods
}

export function residenceCountry(country?: string) {
  const name = country?.trim()
  return name && name.length > 1 ? name : 'United Kingdom'
}

export function keepMethod(country: string, current: string) {
  const methods = methodsForCountry(country)
  return methods.some((item) => item.id === current) ? current : methods[0].id
}
