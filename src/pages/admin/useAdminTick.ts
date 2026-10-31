import { useEffect, useState } from 'react'

export function useAdminTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('clients-changed', sync)
    window.addEventListener('account-changed', sync)
    window.addEventListener('ledger-changed', sync)
    window.addEventListener('admin-notifications-changed', sync)
    window.addEventListener('admins-changed', sync)
    return () => {
      window.removeEventListener('clients-changed', sync)
      window.removeEventListener('account-changed', sync)
      window.removeEventListener('ledger-changed', sync)
      window.removeEventListener('admin-notifications-changed', sync)
      window.removeEventListener('admins-changed', sync)
    }
  }, [])
  return tick
}
