import type { Currency } from './banking'

export type MethodFieldDef = {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  autoComplete?: string
}

export type PaymentFieldContext = {
  country: string
  accountCurrency: Currency
}

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

export type BankRail = 'us' | 'uk' | 'sepa' | 'intl'

export function bankRailForContext(context: PaymentFieldContext): BankRail {
  const country = context.country.trim()
  if (country === 'United States') return 'us'
  if (country === 'United Kingdom') return 'uk'
  if (sepaCountries.has(country)) return 'sepa'
  if (context.accountCurrency === 'USD') return 'us'
  if (context.accountCurrency === 'GBP') return 'uk'
  if (context.accountCurrency === 'EUR') return 'sepa'
  return 'intl'
}

function bankTransferFields(context: PaymentFieldContext): MethodFieldDef[] {
  const base: MethodFieldDef[] = [
    { id: 'accountHolder', label: 'Account holder name', required: true },
    { id: 'bankName', label: 'Bank name', required: true },
  ]
  const rail = bankRailForContext(context)

  if (rail === 'us') {
    return [
      ...base,
      { id: 'accountType', label: 'Account type', placeholder: 'Checking or Savings', required: true },
      { id: 'routingNumber', label: 'Routing number', placeholder: '9 digits', required: true, inputMode: 'numeric' },
      { id: 'accountNumber', label: 'Account number', required: true },
    ]
  }
  if (rail === 'uk') {
    return [
      ...base,
      { id: 'sortCode', label: 'Sort code', placeholder: '00-00-00', required: true },
      { id: 'accountNumber', label: 'Account number', placeholder: '8 digits', required: true },
    ]
  }
  if (rail === 'sepa') {
    return [
      ...base,
      { id: 'iban', label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
      { id: 'bic', label: 'BIC / SWIFT', placeholder: 'COBADEFFXXX', required: true },
    ]
  }
  return [
    ...base,
    { id: 'accountType', label: 'Account type', placeholder: 'Checking, Savings, or Business', required: false },
    { id: 'iban', label: 'IBAN', required: false },
    { id: 'bic', label: 'BIC / SWIFT', required: false },
    { id: 'routingNumber', label: 'Routing number (US)', required: false, inputMode: 'numeric' },
    { id: 'accountNumber', label: 'Account number', required: true },
  ]
}

export function fieldsForPaymentMethod(methodId: string, context?: PaymentFieldContext): MethodFieldDef[] {
  switch (methodId) {
    case 'fps':
      return [
        { id: 'sortCode', label: 'Sort code', placeholder: '00-00-00', required: true },
        { id: 'accountNumber', label: 'Account number', placeholder: '12345678', required: true },
      ]
    case 'ach':
      return [
        { id: 'accountType', label: 'Account type', placeholder: 'Checking or Savings', required: true },
        { id: 'routingNumber', label: 'Routing number', placeholder: '9 digits', required: true, inputMode: 'numeric' },
        { id: 'accountNumber', label: 'Account number', required: true },
      ]
    case 'sepa':
      return [
        { id: 'iban', label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
        { id: 'bic', label: 'BIC / SWIFT', placeholder: 'COBADEFFXXX', required: true },
      ]
    case 'zelle':
      return [{ id: 'zelleContact', label: 'Zelle email or US mobile', required: true, inputMode: 'email' }]
    case 'chime':
      return [{ id: 'chimeTag', label: 'Chime $Cashtag, email, or phone', required: true }]
    case 'interac':
    case 'etransfer':
      return [{ id: 'interacContact', label: 'Interac e-Transfer email or mobile', required: true, inputMode: 'email' }]
    case 'pix':
      return [{ id: 'pixKey', label: 'Pix key', placeholder: 'CPF, email, phone, or EVP', required: true }]
    case 'upi':
      return [{ id: 'upiId', label: 'UPI ID', placeholder: 'name@bank', required: true }]
    case 'payid':
      return [{ id: 'payid', label: 'PayID', placeholder: 'Email or phone registered with your bank', required: true }]
    case 'crypto':
      return [
        { id: 'walletAddress', label: 'Wallet address', required: true },
        { id: 'network', label: 'Network', placeholder: 'e.g. Bitcoin, Ethereum', required: true },
      ]
    case 'apple':
      return [{ id: 'applePayContact', label: 'Apple Pay phone or email', required: true, inputMode: 'email' }]
    case 'google':
      return [{ id: 'googlePayContact', label: 'Google Pay phone or email', required: true, inputMode: 'email' }]
    case 'bank':
      return bankTransferFields(context ?? { country: 'United Kingdom', accountCurrency: 'USD' })
    default:
      return bankTransferFields(context ?? { country: 'United Kingdom', accountCurrency: 'USD' })
  }
}

function validateRouting(values: Record<string, string>) {
  const routing = values.routingNumber?.replace(/\D/g, '') ?? ''
  if (routing && routing.length !== 9) return 'Enter a valid 9-digit routing number.'
  return null
}

function validateSortCode(values: Record<string, string>) {
  const sort = values.sortCode?.replace(/\s/g, '') ?? ''
  if (sort && !/^\d{6}$/.test(sort.replace(/-/g, ''))) return 'Enter a valid sort code (6 digits).'
  return null
}

function validateIbanBic(values: Record<string, string>, bicRequired: boolean) {
  const iban = values.iban?.replace(/\s/g, '') ?? ''
  if (iban && iban.length < 15) return 'Enter a valid IBAN.'
  const bic = values.bic?.replace(/\s/g, '') ?? ''
  if (bicRequired && bic.length < 8) return 'Enter a valid BIC / SWIFT code.'
  if (bic && !/^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(bic)) return 'Enter a valid BIC / SWIFT (8 or 11 characters).'
  return null
}

export function validatePaymentMethodFields(
  methodId: string,
  values: Record<string, string>,
  context?: PaymentFieldContext,
): string | null {
  const fields = fieldsForPaymentMethod(methodId, context)
  for (const field of fields) {
    if (field.required === false) continue
    const value = values[field.id]?.trim() ?? ''
    if (value.length < 2) return `Enter ${field.label.toLowerCase()}.`
  }

  if (methodId === 'fps' || (methodId === 'bank' && values.sortCode)) {
    const sortError = validateSortCode(values)
    if (sortError) return sortError
  }
  if (methodId === 'ach' || methodId === 'bank' || methodId === 'fps') {
    if (values.routingNumber) {
      const routingError = validateRouting(values)
      if (routingError) return routingError
    }
  }
  if (methodId === 'ach') {
    const routing = values.routingNumber?.replace(/\D/g, '') ?? ''
    if (routing.length !== 9) return 'Enter a valid 9-digit routing number.'
  }
  if (methodId === 'sepa') {
    return validateIbanBic(values, true)
  }
  if (methodId === 'bank') {
    const rail = bankRailForContext(context ?? { country: 'United Kingdom', accountCurrency: 'USD' })
    if (rail === 'us') return validateRouting(values)
    if (rail === 'uk') return validateSortCode(values)
    if (rail === 'sepa') return validateIbanBic(values, true)
    if (values.iban || values.bic) return validateIbanBic(values, false)
  }
  return null
}

export function formatPaymentMethodDetails(
  methodId: string,
  values: Record<string, string>,
  context?: PaymentFieldContext,
): string {
  const parts: string[] = []
  for (const field of fieldsForPaymentMethod(methodId, context)) {
    const value = values[field.id]?.trim()
    if (value) parts.push(`${field.label}: ${value}`)
  }
  return parts.join(' · ')
}

export function emptyMethodFieldValues(methodId: string, context?: PaymentFieldContext): Record<string, string> {
  const out: Record<string, string> = {}
  for (const field of fieldsForPaymentMethod(methodId, context)) {
    out[field.id] = ''
  }
  return out
}

export function bankRailHint(context: PaymentFieldContext): string {
  const rail = bankRailForContext(context)
  if (rail === 'us') return 'Enter US routing and account details for the receiving bank.'
  if (rail === 'uk') return 'Enter UK sort code and account number.'
  if (rail === 'sepa') return 'Enter IBAN and BIC for the receiving account.'
  return 'Enter the receiving bank details. Use IBAN and BIC for international accounts, or routing number for US banks.'
}
