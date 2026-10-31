import type { Account } from '../auth/session'
import { bankAccounts, formatMoney, paymentMethodName, supportEmail, type Transaction } from './banking'

export type AppNotification = {
  id: string
  title: string
  body: string
  date: string
  href: string
}

const READ_KEY = 'revolut-clone-notifications-read'

export function loadReadIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]
    return new Set(raw)
  } catch {
    return new Set<string>()
  }
}

function writeRead(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event('notifications-changed'))
}

export function markNotificationRead(id: string) {
  const ids = loadReadIds()
  ids.add(id)
  writeRead(ids)
}

export function markAllNotificationsRead(items: AppNotification[]) {
  const ids = loadReadIds()
  items.forEach((item) => ids.add(item.id))
  writeRead(ids)
}

export function buildNotifications(account: Account | null, transactions: Transaction[]) {
  const items: AppNotification[] = []
  if (account?.kycStatus === 'in_review') {
    items.push({
      id: 'kyc-review',
      title: 'Identity check in review',
      body: 'North Rim Inc limits some payments until this is approved.',
      date: '2026-10-26',
      href: '/dashboard/profile',
    })
  }
  transactions
    .filter((item) => item.status === 'pending')
    .forEach((item) => {
      const accountName = bankAccounts.find((entry) => entry.id === item.accountId)
      const money = formatMoney(Math.abs(item.amount), accountName?.currency ?? 'USD')
      const method = paymentMethodName(item)
      items.push({
        id: `pending-${item.id}`,
        title: item.name.startsWith('Withdrawal')
          ? 'Withdrawal pending verification'
          : item.amount > 0
            ? 'Top up pending'
            : 'Transfer pending',
        body: item.name.startsWith('Withdrawal')
          ? 'You will receive a withdrawal notification once your transaction has been processed.'
          : item.receiptSent
            ? `${money} via ${method} is pending review. Once approved, it can take 1 to 24 hours to show in the account.`
            : item.receiptName
              ? `${money} via ${method} has a receipt attached. Send it from the receipt panel.`
              : `${money} via ${method} is waiting for a receipt.`,
        date: item.date,
        href: `/dashboard/activity/${encodeURIComponent(item.id)}`,
      })
    })
  transactions
    .filter((item) => item.status === 'approved' || item.status === 'declined')
    .forEach((item) => {
      const accountName = bankAccounts.find((entry) => entry.id === item.accountId)
      const money = formatMoney(Math.abs(item.amount), accountName?.currency ?? 'USD')
      const declined = item.status === 'declined'
      items.push({
        id: `${item.status}-${item.id}`,
        title: declined ? 'Payment declined' : 'Payment successful',
        body: declined
          ? `${money} was declined. Contact the support team at ${supportEmail}.`
          : `${money} has been added to your account.`,
        date: item.date,
        href: `/dashboard/activity/${encodeURIComponent(item.id)}`,
      })
    })
  return items
}
