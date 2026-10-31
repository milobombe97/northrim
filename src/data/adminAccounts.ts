import { loadClients, updateClient, type Account } from '../auth/session'
import { supabase } from '../lib/supabase'

export type AccountStatus = 'active' | 'suspended' | 'deleted'

export function accountStatusOf(account: Account): AccountStatus {
  if (account.accountStatus) return account.accountStatus
  if (account.suspended) return 'suspended'
  return 'active'
}

export function withAccountStatus(account: Account, status: AccountStatus): Account {
  return {
    ...account,
    accountStatus: status,
    suspended: status !== 'active',
  }
}

export async function setProfileStatus(userId: string, status: AccountStatus) {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_profile_status', {
      p_user_id: userId,
      p_status: status,
    })
    if (error) return { error: error.message }
    await import('./remote').then((remote) => remote.refreshClientsFromRemote())
    return { ok: true as const }
  }

  const client = loadClients().find((item) => item.id === userId)
  if (!client) return { error: 'Client not found.' }
  updateClient(withAccountStatus(client, status))
  return { ok: true as const }
}

export function ensureCanTransact(account: Account | null | undefined) {
  const status = account ? accountStatusOf(account) : 'active'
  if (status === 'deleted') return 'This account has been closed.'
  if (status === 'suspended') return 'This account is suspended.'
  return null
}
