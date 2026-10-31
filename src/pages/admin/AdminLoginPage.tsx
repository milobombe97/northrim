import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signInAdmin } from '../../auth/admins'
import { useAuth } from '../../auth/AuthContext'
import { useAdmin } from '../../auth/useAdmin'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'

function staffLoginError(remote: { error?: string; account?: { role?: string } }) {
  if (remote.account && remote.account.role !== 'admin' && remote.account.role !== 'super') {
    return 'This email is a client account. Promote them under Admin → Admins, or use a staff email.'
  }
  const message = remote.error ?? 'Email or password was not accepted.'
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email or password is incorrect. Ask a signed-in admin to add you again under Admin → Admins using the same email and a new password (that updates your login), then sign in here — not on Client login.'
  }
  return message
}

export function AdminLoginPage() {
  const admin = useAdmin()
  const { configured, signInAsStaff, signOut } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (admin) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (configured) {
      const result = await signInAsStaff(email, password)
      if (!result.error && result.admin) {
        navigate('/admin')
        return
      }
      if (result.error) {
        await signOut()
        setError(staffLoginError({ error: result.error, account: undefined }))
      }
      return
    }
    const signedIn = signInAdmin(email, password)
    if (!signedIn) {
      setError('Email or password does not match an admin on this browser.')
      return
    }
    navigate('/admin')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="text-lg font-semibold tracking-[-0.03em]">
        North Rim
      </Link>
      <h1 className="mt-8 text-3xl font-medium tracking-[-0.04em]">Admin login</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">
        Staff sign in here. New admins are created in the admin area under Admins (any signed-in admin can add someone).
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <IconText
            icon="mail"
            type="email"
            autoComplete="username"
            required
            placeholder="Staff email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
          />
        </Field>
        <Field label="Password" error={error || undefined}>
          <PasswordInput
            autoComplete="current-password"
            required
            placeholder="Your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
          />
        </Field>
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm text-revolut-ink/55">
        <Link to="/signin" className="font-medium text-revolut-ink hover:underline">
          Client login
        </Link>
      </p>
    </main>
  )
}
