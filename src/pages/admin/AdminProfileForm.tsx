import { type FormEvent, useState } from 'react'
import { adoptRemoteAdmin, isLocalDemoAdminId, updateAdmin, type AdminUser } from '../../auth/admins'
import { supabaseEnabled } from '../../lib/supabase'
import { updateStaffOnRemote } from '../../data/remote'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { IconText, PasswordInput } from '../../components/PasswordInput'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdminProfileForm({
  admin,
  actorId,
  title,
  intro,
}: {
  admin: AdminUser
  actorId: string
  title: string
  intro: string
}) {
  const [firstName, setFirstName] = useState(admin.firstName)
  const [lastName, setLastName] = useState(admin.lastName)
  const [email, setEmail] = useState(admin.email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Enter a first and last name.')
      setSaved('')
      return
    }
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email.')
      setSaved('')
      return
    }
    const nextPassword = password.trim()
    const isRemoteStaffAccount = supabaseEnabled() && !isLocalDemoAdminId(admin.id)
    if (isRemoteStaffAccount) {
      const remote = await updateStaffOnRemote(admin.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: nextPassword || undefined,
      })
      if (remote.error) {
        setError(remote.error)
        setSaved('')
        return
      }
      adoptRemoteAdmin({
        ...admin,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: '',
      })
      setError('')
      setSaved(
        nextPassword
          ? 'Profile and password saved. If you changed your password, sign in again with the new password.'
          : 'Profile saved.',
      )
      setPassword('')
      return
    }
    const result = updateAdmin(actorId, admin.id, {
      firstName,
      lastName,
      email,
      password: nextPassword || undefined,
    })
    setError(result)
    setSaved(result ? '' : nextPassword ? 'Profile and password saved.' : 'Profile saved.')
    if (!result) setPassword('')
  }

  return (
    <form className="max-w-3xl" onSubmit={onSubmit}>
      <h1 className="text-3xl font-medium tracking-[-0.04em]">{title}</h1>
      <p className="mt-2 text-sm text-revolut-ink/60">{intro}</p>
      <div className="mt-6 grid gap-4 rounded-[1.5rem] bg-white p-5 sm:grid-cols-2">
        <Field label="First name">
          <IconText icon="user" required value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </Field>
        <Field label="Last name">
          <IconText icon="user" required value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </Field>
        <Field label="Email">
          <IconText icon="mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="New password" hint="Leave blank to keep the current password. At least 8 characters." error={error || undefined}>
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
          />
        </Field>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit">Save profile</Button>
          {saved && <p className="text-sm text-revolut-ink/60">{saved}</p>}
        </div>
      </div>
    </form>
  )
}
