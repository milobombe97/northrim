import { type FormEvent, type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountSettings, saveAccount, type Account, type NotificationPrefs } from '../../auth/session'
import { updateOwnPassword } from '../../data/remote'
import { supabaseEnabled } from '../../lib/supabase'
import { useAccount } from '../../auth/useAccount'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { Field } from '../../components/Field'
import { Glyph, IconText, PasswordInput, type FieldIconName } from '../../components/PasswordInput'
import { PhoneInput } from '../../components/PhoneInput'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DashboardSettings() {
  const account = useAccount()
  if (!account) return null

  return (
    <main className="max-w-3xl">
      <Link to="/dashboard/profile" className="text-sm font-medium text-revolut-ink/55 hover:text-revolut-ink">
        Profile
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Profile settings</h1>
      <p className="mt-2 max-w-xl text-sm text-revolut-ink/60">
        Update how your North Rim Inc account looks and how you hear from it. Changes stay in this browser.
      </p>

      <div className="mt-8 space-y-6">
        <DetailsForm account={account} />
        <AddressForm account={account} />
        <PasswordForm account={account} />
        <AlertsForm account={account} />
      </div>
    </main>
  )
}

function DetailsForm({ account }: { account: Account }) {
  const [firstName, setFirstName] = useState(account.firstName)
  const [lastName, setLastName] = useState(account.lastName)
  const [email, setEmail] = useState(account.email)
  const [phone, setPhone] = useState(account.phone)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (firstName.trim().length < 2) next.firstName = 'Enter your first name.'
    if (lastName.trim().length < 2) next.lastName = 'Enter your last name.'
    if (!emailPattern.test(email.trim())) next.email = 'Enter a valid email.'
    if (phone.replace(/\D/g, '').length < 8) next.phone = 'Enter a mobile number.'
    setErrors(next)
    setSaved(false)
    if (Object.keys(next).length > 0) return
    saveAccount({
      ...account,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    })
    setSaved(true)
  }

  return (
    <Section title="Personal details" icon="user" saved={saved} onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          <IconText
            icon="user"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <IconText
            icon="user"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Email" error={errors.email}>
        <IconText
          icon="mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Mobile" error={errors.phone}>
        <PhoneInput value={phone} onChange={setPhone} />
      </Field>
      <Button type="submit">Save details</Button>
    </Section>
  )
}

function AddressForm({ account }: { account: Account }) {
  const kyc = account.kyc
  const [line, setLine] = useState(kyc?.addressLine ?? '')
  const [city, setCity] = useState(kyc?.city ?? '')
  const [postcode, setPostcode] = useState(kyc?.postcode ?? '')
  const [country, setCountry] = useState(kyc?.country ?? 'United Kingdom')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!kyc) return
    const next: Record<string, string> = {}
    if (line.trim().length < 4) next.line = 'Enter your street address.'
    if (city.trim().length < 2) next.city = 'Enter your city.'
    if (postcode.trim().length < 3) next.postcode = 'Enter your postcode.'
    if (country.trim().length < 2) next.country = 'Enter your country.'
    setErrors(next)
    setSaved(false)
    if (Object.keys(next).length > 0) return
    saveAccount({
      ...account,
      kyc: {
        ...kyc,
        addressLine: line.trim(),
        city: city.trim(),
        postcode: postcode.trim().toUpperCase(),
        country: country.trim(),
      },
    })
    setSaved(true)
  }

  return (
    <Section
      title="Home address"
      icon="home"
      note="Your identity document stays as submitted. Only the address on the profile changes."
      saved={saved}
      onSubmit={onSubmit}
    >
      {kyc ? (
        <>
          <Field label="Street address" error={errors.line}>
            <IconText
              icon="home"
              autoComplete="street-address"
              value={line}
              onChange={(event) => setLine(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" error={errors.city}>
              <IconText icon="pin" autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
            <Field label="Postcode" error={errors.postcode}>
              <IconText icon="hash" autoComplete="postal-code" value={postcode} onChange={(event) => setPostcode(event.target.value)} />
            </Field>
          </div>
          <Field label="Country" error={errors.country}>
            <CountrySelect value={country} onChange={setCountry} />
          </Field>
          <Button type="submit">Save address</Button>
        </>
      ) : (
        <p className="text-sm text-revolut-ink/60">Finish the identity check to add a home address.</p>
      )}
    </Section>
  )
}

function PasswordForm({ account }: { account: Account }) {
  const [current, setCurrent] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!supabaseEnabled() && current !== account.password) next.current = 'That does not match your current password.'
    if (nextPassword.length < 8) next.next = 'Use at least 8 characters.'
    if (nextPassword !== confirm) next.confirm = 'Those passwords do not match.'
    setErrors(next)
    setSaved(false)
    if (Object.keys(next).length > 0) return
    if (supabaseEnabled()) {
      const remote = await updateOwnPassword(current, nextPassword)
      if (remote.error) {
        setErrors({ current: remote.error })
        return
      }
    }
    saveAccount({ ...account, password: nextPassword })
    setCurrent('')
    setNextPassword('')
    setConfirm('')
    setSaved(true)
  }

  return (
    <Section
      title="Password"
      icon="lock"
      note={supabaseEnabled() ? 'This updates the password you use to sign in.' : 'Your password stays in this browser so you can sign in again on this device.'}
      saved={saved}
      savedLabel="Password updated."
      onSubmit={onSubmit}
    >
      <Field label="Current password" error={errors.current}>
        <PasswordInput
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </Field>
      <Field label="New password" error={errors.next}>
        <PasswordInput
          autoComplete="new-password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
        />
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        <PasswordInput
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>
      <Button type="submit">Update password</Button>
    </Section>
  )
}

function AlertsForm({ account }: { account: Account }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(accountSettings(account).notifications)
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }))
    setSaved(false)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    saveAccount({
      ...account,
      settings: { notifications: prefs },
    })
    setSaved(true)
  }

  return (
    <Section title="Alerts" icon="bell" saved={saved} onSubmit={onSubmit}>
      <div className="divide-y divide-revolut-line">
        <Toggle
          icon="banknote"
          label="Payments"
          hint="When money arrives or leaves an account."
          checked={prefs.payments}
          onChange={() => toggle('payments')}
        />
        <Toggle
          icon="card"
          label="Card activity"
          hint="When your card is used or frozen."
          checked={prefs.cardActivity}
          onChange={() => toggle('cardActivity')}
        />
        <Toggle
          icon="bell"
          label="Offers"
          hint="Product news and promotions. Off by default."
          checked={prefs.marketing}
          onChange={() => toggle('marketing')}
        />
      </div>
      <Button type="submit" className="mt-4">
        Save alerts
      </Button>
    </Section>
  )
}

function Section({
  title,
  icon,
  note,
  saved,
  savedLabel = 'Saved.',
  onSubmit,
  children,
}: {
  title: string
  icon: FieldIconName
  note?: string
  saved: boolean
  savedLabel?: string
  onSubmit: (event: FormEvent) => void
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[1.5rem] bg-white p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium tracking-[-0.03em]">
          <Glyph name={icon} />
          {title}
        </h2>
        {note && <p className="mt-1 text-sm text-revolut-ink/55">{note}</p>}
      </div>
      {children}
      {saved && (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {savedLabel}
        </p>
      )}
    </form>
  )
}

function Toggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: FieldIconName
  label: string
  hint: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-4">
      <span className="flex gap-3">
        <Glyph name={icon} className="mt-0.5 size-4 shrink-0 text-revolut-ink/45" />
        <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-revolut-ink/50">{hint}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 size-4 accent-revolut-ink"
        checked={checked}
        onChange={onChange}
      />
    </label>
  )
}
