import { useAdmin } from '../../auth/useAdmin'
import { AdminProfileForm } from './AdminProfileForm'

export function AdminSettingsPage() {
  const admin = useAdmin()
  if (!admin) return null

  return (
    <main>
      <AdminProfileForm
        key={`${admin.id}-${admin.email}`}
        admin={admin}
        actorId={admin.id}
        title="Profile settings"
        intro="Update your name, email, and password. This stays in this browser."
      />
    </main>
  )
}
