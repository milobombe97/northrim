import { Link, useParams } from 'react-router-dom'
import { loadAdmins } from '../../auth/admins'
import { useAdmin } from '../../auth/useAdmin'
import { AdminProfileForm } from './AdminProfileForm'
import { useAdminTick } from './useAdminTick'

export function AdminStaffPage() {
  const actor = useAdmin()
  const { id = '' } = useParams()
  const tick = useAdminTick()
  const admin = loadAdmins().find((item) => item.id === id)
  void tick

  if (!actor) return null
  if (!admin) {
    return (
      <main>
        <h1 className="text-3xl font-medium tracking-[-0.04em]">Admin not found</h1>
        <Link to="/admin/team" className="mt-4 inline-block text-sm font-medium hover:underline">Admins</Link>
      </main>
    )
  }

  return (
    <main className="space-y-4">
      <Link to="/admin/team" className="text-sm font-medium text-revolut-ink/60 hover:text-revolut-ink">Admins</Link>
      <AdminProfileForm
        key={`${admin.id}-${admin.email}-${admin.firstName}`}
        admin={admin}
        actorId={actor.id}
        title={`${admin.firstName} ${admin.lastName}`}
        intro={admin.role === 'super' ? 'Super admin. You can change this profile, email, and password.' : 'Change this admin’s name, email, and password.'}
      />
    </main>
  )
}
