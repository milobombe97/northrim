import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { loadAccount } from '../../auth/session'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { PhoneInput } from '../../components/PhoneInput'
import { IconText, PasswordInput } from '../../components/PasswordInput'
import { AuthLayout } from './AuthLayout'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

const empty: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
}

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm] = useState<FormState>(() => {
    const existing = loadAccount()
    if (!existing || existing.kycStatus !== 'not_started') return empty
    return {
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      phone: existing.phone,
      password: existing.password,
    }
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState('')

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name.'
    if (form.lastName.trim().length < 2) next.lastName = 'Enter your last name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email.'
    if (form.phone.replace(/\D/g, '').length < 8) next.phone = 'Enter a mobile number.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    const existing = loadAccount()
    const editing = existing?.signedIn && existing.kycStatus === 'not_started'
    if (existing && !editing && existing.email.toLowerCase() === form.email.trim().toLowerCase()) {
      next.email = 'An account with this email already exists in this browser.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    const existing = loadAccount()
    const editing = existing?.signedIn && existing.kycStatus === 'not_started'
    const next = {
      ...(editing ? existing : { id: `client-${Date.now()}` }),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      signedIn: true,
      kycStatus: 'not_started' as const,
    }
    const remote = await signUp(next)
    if (remote.error) {
      setFormError(remote.error)
      return
    }
    navigate('/kyc')
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="We’ll ask you to confirm your identity next. Banks do this before an account can be used."
      step={{ current: 1, total: 4, label: 'Account' }}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            <IconText
              icon="user"
              autoComplete="given-name"
              placeholder="Alex"
              value={form.firstName}
              onChange={(event) => set('firstName', event.target.value)}
            />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <IconText
              icon="user"
              autoComplete="family-name"
              placeholder="Morgan"
              value={form.lastName}
              onChange={(event) => set('lastName', event.target.value)}
            />
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          <IconText
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
          />
        </Field>
        <Field label="Mobile number" error={errors.phone}>
          <PhoneInput value={form.phone} onChange={(value) => set('phone', value)} />
        </Field>
        <Field label="Password" error={errors.password} hint="Stored only in this browser.">
          <PasswordInput
            autoComplete="new-password"
            showGuide
            placeholder="Create a password"
            value={form.password}
            onChange={(event) => set('password', event.target.value)}
          />
        </Field>
        <Button type="submit" className="mt-2 w-full">
          Continue to identity check
        </Button>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      </form>
      <p className="mt-6 text-sm text-revolut-ink/65">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-revolut-ink underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
