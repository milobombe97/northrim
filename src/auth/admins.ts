const ADMINS_KEY = 'revolut-clone-admins'
const SESSION_KEY = 'revolut-clone-admin-session'

export type AdminRole = 'super' | 'admin'

export type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: AdminRole
}

const superAdmin: AdminUser = {
  id: 'super',
  firstName: 'Super',
  lastName: 'Admin',
  email: 'admin@northrimbankinc.com',
  password: 'admin-pass-1',
  role: 'super',
}

export function loadAdmins(): AdminUser[] {
  try {
    const raw = localStorage.getItem(ADMINS_KEY)
    const stored = raw ? (JSON.parse(raw) as AdminUser[]) : []
    if (!stored.some((item) => item.role === 'super')) return [superAdmin, ...stored.filter((item) => item.id !== 'super')]
    return stored
  } catch {
    return [superAdmin]
  }
}

function saveAdmins(admins: AdminUser[]) {
  const next = admins.some((item) => item.role === 'super') ? admins : [superAdmin, ...admins]
  localStorage.setItem(ADMINS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('admins-changed'))
}

export function loadAdminSession(): AdminUser | null {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    return loadAdmins().find((item) => item.id === id) ?? null
  } catch {
    return null
  }
}

export function signInAdmin(email: string, password: string) {
  const admin = loadAdmins().find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
  )
  if (!admin) return null
  localStorage.setItem(SESSION_KEY, admin.id)
  window.dispatchEvent(new Event('admins-changed'))
  return admin
}

/** Local demo account only — not a Supabase user. */
export function isLocalDemoAdminId(id: string) {
  return id === 'super' || id.startsWith('admin-')
}

export function adoptRemoteAdmin(admin: AdminUser) {
  const without = loadAdmins().filter(
    (item) => item.id !== admin.id && !(admin.role === 'super' && isLocalDemoAdminId(item.id)),
  )
  saveAdmins([admin, ...without])
  localStorage.setItem(SESSION_KEY, admin.id)
  window.dispatchEvent(new Event('admins-changed'))
}

export function signOutAdmin() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('admins-changed'))
}

export function addAdmin(entry: Omit<AdminUser, 'id' | 'role'>) {
  const admin: AdminUser = { ...entry, id: `admin-${Date.now()}`, role: 'admin' }
  saveAdmins([admin, ...loadAdmins()])
  return admin
}

export function updateAdmin(
  actorId: string,
  id: string,
  patch: { firstName: string; lastName: string; email: string; password?: string },
) {
  const admins = loadAdmins()
  const actor = admins.find((item) => item.id === actorId)
  const target = admins.find((item) => item.id === id)
  if (!actor || !target) return 'That admin could not be found.'
  if (target.role === 'super' && actor.id !== id) {
    return 'The super admin profile can only be edited by signing in as that account.'
  }
  const email = patch.email.trim()
  if (
    admins.some(
      (item) =>
        item.id !== id &&
        !isLocalDemoAdminId(item.id) &&
        item.email.toLowerCase() === email.toLowerCase(),
    )
  ) {
    return 'Another admin already uses that email.'
  }
  if (patch.password && patch.password.length < 8) return 'Use at least 8 characters.'
  saveAdmins(
    admins.map((item) =>
      item.id === id
        ? {
            ...item,
            firstName: patch.firstName.trim(),
            lastName: patch.lastName.trim(),
            email,
            password: patch.password || item.password,
          }
        : item,
    ),
  )
  return ''
}

export function removeAdmin(id: string) {
  const target = loadAdmins().find((item) => item.id === id)
  if (!target || target.role === 'super') return
  saveAdmins(loadAdmins().filter((item) => item.id !== id))
  if (localStorage.getItem(SESSION_KEY) === id) signOutAdmin()
}
