import type { StoredFile } from '../data/files'

const STORAGE_KEY = 'revolut-clone-account'

export type KycStatus = 'not_started' | 'in_review' | 'verified' | 'rejected'

export type KycProfile = {
  legalFirstName: string
  legalLastName: string
  dateOfBirth: string
  nationality: string
  documentType: 'passport' | 'driving_licence' | 'national_id'
  documentNumber: string
  documentExpiry: string
  documentFileName: string
  documentFile?: StoredFile
  documentPath?: string
  documentStored?: boolean
  documentBackFileName?: string
  documentBackFile?: StoredFile
  documentBackPath?: string
  documentBackStored?: boolean
  selfieFileName?: string
  selfieFile?: StoredFile
  selfiePath?: string
  selfieStored?: boolean
  proofOfAddressFileName?: string
  proofOfAddressFile?: StoredFile
  proofOfAddressPath?: string
  proofOfAddressStored?: boolean
  submissionId?: string
  rejectionReason?: string
  addressLine: string
  city: string
  postcode: string
  country: string
}

export type NotificationPrefs = {
  payments: boolean
  cardActivity: boolean
  marketing: boolean
}

export type ProfileSettings = {
  notifications: NotificationPrefs
}

export type AccountStatus = 'active' | 'suspended' | 'deleted'

export type Account = {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  signedIn: boolean
  accountStatus?: AccountStatus
  suspended?: boolean
  role?: 'client' | 'admin' | 'super'
  kycStatus: KycStatus
  kyc?: KycProfile
  settings?: ProfileSettings
}

const CLIENTS_KEY = 'revolut-clone-clients'

export function loadClients(): Account[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    const stored = raw ? (JSON.parse(raw) as Account[]) : []
    const current = readAccount()
    if (!current) return stored
    const id = current.id || 'primary'
    const record = { ...current, id, signedIn: false }
    if (stored.some((item) => item.id === id)) return stored
    return [record, ...stored]
  } catch {
    return []
  }
}

export function saveClients(clients: Account[]) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients.map((item) => ({ ...item, signedIn: false }))))
  window.dispatchEvent(new Event('clients-changed'))
}

function readAccount(): Account | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

export function accountSettings(account: Account): ProfileSettings {
  return {
    notifications: {
      payments: account.settings?.notifications.payments ?? true,
      cardActivity: account.settings?.notifications.cardActivity ?? true,
      marketing: account.settings?.notifications.marketing ?? false,
    },
  }
}

export function loadAccount(): Account | null {
  const account = readAccount()
  if (!account) return null
  return account.id ? account : { ...account, id: 'primary' }
}

export function saveAccount(account: Account) {
  const next = { ...account, id: account.id || 'primary' }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  const clients = loadClients().filter((item) => item.id !== next.id)
  saveClients([next, ...clients])
  window.dispatchEvent(new Event('account-changed'))
  void import('../data/remote').then((remote) => remote.pushProfile(next))
}

export function updateClient(account: Account) {
  const next = { ...account, id: account.id || 'primary', signedIn: false }
  const clients = loadClients().filter((item) => item.id !== next.id)
  saveClients([next, ...clients])
  const current = loadAccount()
  if (current?.id === next.id) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, signedIn: current.signedIn }))
    window.dispatchEvent(new Event('account-changed'))
  }
  void import('../data/remote').then((remote) => remote.pushProfile(next))
}

export function clearAccount() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('account-changed'))
}
