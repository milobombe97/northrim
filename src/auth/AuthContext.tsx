import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signOutAdmin } from './admins'
import { loadAccount, saveAccount, type Account } from './session'
import type { AdminUser } from './admins'
import {
  fetchStaffRole,
  restoreSupabaseSession,
  signInStaffForAdminPortal,
  signInWithSupabase,
  signUpWithSupabase,
} from '../data/remote'
import { supabase, supabaseEnabled } from '../lib/supabase'

type AuthResult = { error?: string; account?: Account }
type StaffRole = 'admin' | 'super'

type AuthContextValue = {
  session: Session | null
  staffRole: StaffRole | null
  loading: boolean
  configured: boolean
  signUp: (account: Account) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signInAsStaff: (email: string, password: string) => Promise<{ error?: string; admin?: AdminUser }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null)
  const [loading, setLoading] = useState(supabaseEnabled())

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true
    void (async () => {
      await restoreSupabaseSession()
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        const role = await fetchStaffRole(data.session.user.id)
        if (active) setStaffRole(role)
      } else if (active) {
        setStaffRole(null)
      }
      setLoading(false)
    })()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      void (async () => {
        if (!next?.user) {
          setStaffRole(null)
          return
        }
        const role = await fetchStaffRole(next.user.id)
        setStaffRole(role)
      })()
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      staffRole,
      loading,
      configured: supabaseEnabled(),
      async signUp(account) {
        if (!supabase) {
          saveAccount(account)
          return { account }
        }
        return signUpWithSupabase(account)
      },
      async signIn(email, password) {
        if (supabase) {
          const result = await signInWithSupabase(email, password)
          if (!result.error) {
            const { data } = await supabase.auth.getSession()
            setSession(data.session)
            if (result.account?.role === 'admin' || result.account?.role === 'super') {
              setStaffRole(result.account.role)
            } else {
              setStaffRole(null)
            }
          }
          return result
        }
        const account = loadAccount()
        if (!account || account.email.toLowerCase() !== email.trim().toLowerCase() || account.password !== password) {
          return { error: 'Email or password does not match the account on this browser.' }
        }
        const next = { ...account, signedIn: true }
        saveAccount(next)
        return { account: next }
      },
      async signInAsStaff(email, password) {
        if (!supabase) return { error: 'Supabase is not configured.' }
        const result = await signInStaffForAdminPortal(email, password)
        if (result.error || !result.admin) return { error: result.error ?? 'Sign-in failed.' }
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setStaffRole(result.admin.role)
        return { admin: result.admin }
      },
      async signOut() {
        const account = loadAccount()
        if (account?.signedIn) saveAccount({ ...account, signedIn: false })
        signOutAdmin()
        if (supabase) await supabase.auth.signOut()
        setSession(null)
        setStaffRole(null)
      },
    }),
    [loading, session, staffRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
