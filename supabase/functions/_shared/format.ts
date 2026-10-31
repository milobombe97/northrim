export function formatMoney(amount: number, currency = 'USD') {
  const locale = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'en-GB'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function maskEmail(email: string) {
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return trimmed
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${local.length > 2 ? '•••' : ''}@${domain}`
}

export function profileDisplayName(profile: { first_name?: string; last_name?: string; email?: string }) {
  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
  return name || profile.email || 'Account holder'
}

export function formatTransferTimestamp(iso?: string) {
  const date = iso ? new Date(iso) : new Date()
  return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`
}
