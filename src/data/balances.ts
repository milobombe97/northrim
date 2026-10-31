import { loadAccount } from '../auth/session'

const BALANCES_KEY = 'revolut-clone-balances'

export function savePostedBalances(userId: string, balances: Record<string, number>) {
  localStorage.setItem(`${BALANCES_KEY}:${userId}`, JSON.stringify(balances))
  window.dispatchEvent(new Event('ledger-changed'))
}

export function loadPostedBalances(userId?: string): Record<string, number> | null {
  const id = userId || loadAccount()?.id
  if (!id || id === 'primary') return null
  try {
    const raw = localStorage.getItem(`${BALANCES_KEY}:${id}`)
    return raw ? (JSON.parse(raw) as Record<string, number>) : null
  } catch {
    return null
  }
}
