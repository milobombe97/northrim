import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'
import { AuthLayout } from './AuthLayout'

export function SignInPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = await signIn(email, password)
    if (result.error || !result.account) {
      setError(result.error ?? 'Email or password was not accepted.')
      return
    }
    if (result.account.role === 'admin' || result.account.role === 'super') {
      navigate('/admin')
      return
    }
    if (result.account.kycStatus === 'not_started' || result.account.kycStatus === 'rejected') {
      navigate('/kyc')
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Use the email and password from the account you created in this browser."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <IconText
            icon="mail"
            type="email"
            autoComplete="email"
            required
            placeholder="name@email.com"
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
        <Button type="submit" className="mt-2 w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm text-revolut-ink/65">
        New here?{' '}
        <Link to="/signup" className="font-medium text-revolut-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
