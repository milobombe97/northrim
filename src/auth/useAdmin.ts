import { useEffect, useState } from 'react'
import { loadAdminSession, type AdminUser } from './admins'

export function useAdmin() {
  const [admin, setAdmin] = useState<AdminUser | null>(() => loadAdminSession())

  useEffect(() => {
    const sync = () => setAdmin(loadAdminSession())
    window.addEventListener('admins-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('admins-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return admin
}
