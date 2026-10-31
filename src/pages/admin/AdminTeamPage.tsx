import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addAdmin, adoptRemoteAdmin, loadAdmins, removeAdmin, type AdminUser } from '../../auth/admins'
import { useAuth } from '../../auth/AuthContext'
import { useAdmin } from '../../auth/useAdmin'
import { Button } from '../../components/Button'
import { Field, TextInput } from '../../components/Field'
import { PasswordInput } from '../../components/PasswordInput'
import { supabaseEnabled } from '../../lib/supabase'
import { createStaffOnRemote, listStaffFromRemote } from '../../data/remote'

export function AdminTeamPage() {
  const current = useAdmin()
  const { configured } = useAuth()
  const remoteStaff = configured && supabaseEnabled()
  const [tick, setTick] = useState(0)
  const [staff, setStaff] = useState<AdminUser[]>(() => loadAdmins())
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sync = () => setTick((value) => value + 1)
    window.addEventListener('admins-changed', sync)
    return () => window.removeEventListener('admins-changed', sync)
  }, [])

  useEffect(() => {
    if (!remoteStaff) {
      setStaff(loadAdmins())
      return
    }
    void listStaffFromRemote().then((result) => {
      if (result.admins?.length) setStaff(result.admins)
    })
  }, [remoteStaff, tick])

  const admins = remoteStaff ? staff : loadAdmins()
  const canRemove = current?.role === 'super'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (admins.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('An admin with that email already exists.')
      return
    }
    setBusy(true)
    setError('')
    if (remoteStaff) {
      const result = await createStaffOnRemote({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      })
      setBusy(false)
      if (result.error || !result.admin) {
        setError(result.error ?? 'Could not create staff account.')
        return
      }
      adoptRemoteAdmin(result.admin)
      setStaff((prev) => [result.admin!, ...prev.filter((item) => item.id !== result.admin!.id)])
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      return
    } else {
      addAdmin({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password })
      setBusy(false)
    }
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
  }

  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Admins</h1>
        <p className="mt-2 text-sm text-revolut-ink/60">
          {remoteStaff
            ? 'Add staff here to create their Supabase login (admin role). Any signed-in admin can add people; they then sign in at Admin login.'
            : 'You can edit every admin’s name, email, and password, including your own. Only the super admin can remove someone from this browser list.'}
        </p>
      </div>
      <ul className="overflow-hidden rounded-[1.5rem] bg-white">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center justify-between gap-4 border-b border-revolut-line px-5 py-4 last:border-b-0">
            <span>
              <span className="block font-medium">{admin.firstName} {admin.lastName}</span>
              <span className="block text-sm text-revolut-ink/55">{admin.email}</span>
            </span>
            <span className="flex items-center gap-2">
              {admin.role === 'super' && <span className="text-sm text-revolut-ink/55">Super admin</span>}
              <Link to={`/admin/team/${admin.id}`} className="rounded-full border border-revolut-line px-4 py-2 text-sm font-medium">Edit</Link>
              {admin.role !== 'super' && canRemove && (
                <Button type="button" variant="secondary" onClick={() => removeAdmin(admin.id)}>Remove</Button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <form className="rounded-[1.5rem] bg-white p-5" onSubmit={onSubmit}>
        <h2 className="text-lg font-medium">Add an admin</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="First name"><TextInput required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></Field>
          <Field label="Last name"><TextInput required value={lastName} onChange={(event) => setLastName(event.target.value)} /></Field>
          <Field label="Email"><TextInput type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Password" error={error || undefined}>
            <PasswordInput required value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} />
          </Field>
        </div>
        <Button type="submit" className="mt-4" disabled={busy}>
          {busy ? 'Creating…' : 'Add admin'}
        </Button>
      </form>
      <span className="hidden">{tick}</span>
    </main>
  )
}
