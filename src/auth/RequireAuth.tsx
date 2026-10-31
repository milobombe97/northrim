import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from './useAdmin'
import { useAccount } from './useAccount'
import { useAuth } from './AuthContext'
import { accountStatusOf } from '../data/adminAccounts'

export function RequireAuth({ area, children }: { area: 'customer' | 'admin'; children: ReactNode }) {
  const { session, staffRole, loading, configured } = useAuth()
  const account = useAccount()
  const admin = useAdmin()

  if (loading) {
    return <p className="p-8 text-sm text-revolut-ink/60">Checking your session…</p>
  }

  if (area === 'admin') {
    if (configured) {
      const staffOk =
        staffRole === 'admin' ||
        staffRole === 'super' ||
        admin?.role === 'admin' ||
        admin?.role === 'super'
      if (!session || !staffOk) {
        return <Navigate to="/admin/login" replace />
      }
    } else if (!admin) {
      return <Navigate to="/admin/login" replace />
    }
  } else {
    const signedIn = Boolean(account)
    if (configured && !session) {
      return <Navigate to="/signin" replace />
    }
    if (!signedIn) {
      return <Navigate to="/signin" replace />
    }
  }

  if (area === 'customer' && account) {
    const status = accountStatusOf(account)
    if (status === 'deleted') {
      return <Navigate to="/signin" replace />
    }
  }

  return children
}
