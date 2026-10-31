import { loadClients } from '../auth/session'
import { bankAccounts, formatMoney, loadClientTransactions, paymentMethodName } from './banking'

export type AdminNotice = {
  id: string
  title: string
  body: string
  date: string
  href: string
  icon: 'shield' | 'banknote'
}

const READ_KEY = 'revolut-clone-admin-notifications-read'

export function buildAdminNotifications(): AdminNotice[] {
  const items: AdminNotice[] = []
  for (const client of loadClients()) {
    const name = `${client.firstName} ${client.lastName}`
    if (client.kycStatus === 'in_review') {
      const document =
        client.kyc?.documentType === 'passport'
          ? 'passport'
          : client.kyc?.documentType === 'driving_licence'
            ? 'driving licence'
            : 'identity document'
      items.push({
        id: `kyc-${client.id}`,
        title: 'Identity check waiting',
        body: `${name} submitted a ${document}. Open the documents before approving.`,
        date: '2026-10-26',
        href: `/admin/kyc/${client.id}`,
        icon: 'shield',
      })
    }
    for (const payment of loadClientTransactions(client.id || 'primary').filter((item) => item.status === 'pending')) {
      const account = bankAccounts.find((item) => item.id === payment.accountId)
      const money = formatMoney(payment.amount, account?.currency ?? 'GBP')
      const receipt = payment.receiptFile || payment.receiptName ? 'A receipt is attached.' : 'No receipt has been uploaded.'
      items.push({
        id: `pay-${client.id}-${payment.id}`,
        title: payment.name.startsWith('Withdrawal')
          ? 'Withdrawal to review'
          : payment.amount > 0
            ? 'Top up to review'
            : 'Transfer to review',
        body: `${name} · ${money} via ${paymentMethodName(payment)}. ${receipt}`,
        date: payment.date,
        href: `/admin/payments/${client.id}/${encodeURIComponent(payment.id)}`,
        icon: 'banknote',
      })
    }
  }
  return items
}

export function loadAdminReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[])
  } catch {
    return new Set<string>()
  }
}

function writeRead(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event('admin-notifications-changed'))
}

export function markAdminNotificationRead(id: string) {
  const ids = loadAdminReadIds()
  ids.add(id)
  writeRead(ids)
}

export function markAllAdminNotificationsRead(items: AdminNotice[]) {
  const ids = loadAdminReadIds()
  items.forEach((item) => ids.add(item.id))
  writeRead(ids)
}
