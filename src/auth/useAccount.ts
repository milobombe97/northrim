import { useEffect, useState } from 'react'
import { loadAccount, type Account } from './session'

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(() => {
    const stored = loadAccount()
    return stored?.signedIn ? stored : null
  })

  useEffect(() => {
    const sync = () => {
      const stored = loadAccount()
      setAccount(stored?.signedIn ? stored : null)
    }
    window.addEventListener('account-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('account-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return account
}
