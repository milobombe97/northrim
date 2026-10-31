import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Server auth is not configured.')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function requireStaffActor(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return { error: json({ error: 'Sign in again.' }, 401) }

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) return { error: json({ error: 'Server auth is not configured.' }, 500) }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return { error: json({ error: 'Sign in again.' }, 401) }

  const admin = serviceClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError || !profile || profile.status !== 'active') {
    return { error: json({ error: 'Sign in again.' }, 401) }
  }
  if (profile.role !== 'admin' && profile.role !== 'super') {
    return { error: json({ error: 'Only staff can use this endpoint.' }, 403) }
  }

  return { admin, actorId: userData.user.id, actorRole: profile.role as 'admin' | 'super' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const gate = await requireStaffActor(req)
    if ('error' in gate && gate.error) return gate.error
    const { admin, actorId, actorRole } = gate

    const body = await req.json()
    const action = String(body.action ?? '')

    if (action === 'create') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const firstName = String(body.firstName ?? '').trim()
      const lastName = String(body.lastName ?? '').trim()

      if (!email || password.length < 8) {
        return json({ error: 'Use a valid email and a password of at least 8 characters.' }, 400)
      }
      if (firstName.length < 2 || lastName.length < 2) {
        return json({ error: 'Enter a first and last name.' }, 400)
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      })

      if (createError) {
        const alreadyRegistered =
          createError.message.includes('already been registered') ||
          createError.message.includes('already exists') ||
          createError.message.includes('duplicate')

        if (alreadyRegistered) {
          let existingProfile: { id: string; role: string; status: string } | null = null
          const { data: byEmail } = await admin
            .from('profiles')
            .select('id, role, status')
            .ilike('email', email)
            .maybeSingle()
          existingProfile = byEmail

          if (!existingProfile) {
            const { data: userPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
            if (!listError && userPage?.users) {
              const authUser = userPage.users.find((u) => u.email?.trim().toLowerCase() === email)
              if (authUser) {
                const { data: byId } = await admin
                  .from('profiles')
                  .select('id, role, status')
                  .eq('id', authUser.id)
                  .maybeSingle()
                existingProfile = byId
              }
            }
          }

          if (existingProfile?.role === 'admin' || existingProfile?.role === 'super') {
            const { error: passwordError } = await admin.auth.admin.updateUserById(existingProfile.id, {
              password,
              email_confirm: true,
            })
            if (passwordError) return json({ error: passwordError.message }, 400)
            const { error: profileError } = await admin
              .from('profiles')
              .update({
                first_name: firstName,
                last_name: lastName,
                email,
              })
              .eq('id', existingProfile.id)
            if (profileError) return json({ error: profileError.message }, 500)
            return json({
              admin: {
                id: existingProfile.id,
                email,
                firstName,
                lastName,
                role: existingProfile.role,
              },
            })
          }

          if (existingProfile?.id && existingProfile.role === 'customer') {
            const { error: passwordError } = await admin.auth.admin.updateUserById(existingProfile.id, { password })
            if (passwordError) return json({ error: passwordError.message }, 400)
            const { error: profileError } = await admin.from('profiles').upsert(
              {
                id: existingProfile.id,
                role: 'admin',
                email,
                first_name: firstName,
                last_name: lastName,
                phone: '',
                status: 'active',
                kyc_status: 'not_started',
              },
              { onConflict: 'id' },
            )
            if (profileError) return json({ error: profileError.message }, 500)
            return json({
              admin: {
                id: existingProfile.id,
                email,
                firstName,
                lastName,
                role: 'admin',
              },
            })
          }

          return json({
            error:
              'That email is already registered but has no profile yet. Add the user in Supabase Auth, then try again.',
          }, 400)
        }

        return json({ error: createError.message }, 400)
      }

      const userId = created.user?.id
      if (!userId) return json({ error: 'User was not created.' }, 500)

      const { error: syncPasswordError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (syncPasswordError) return json({ error: syncPasswordError.message }, 500)

      const { error: profileError } = await admin.from('profiles').upsert(
        {
          id: userId,
          role: 'admin',
          email,
          first_name: firstName,
          last_name: lastName,
          phone: '',
          status: 'active',
          kyc_status: 'not_started',
        },
        { onConflict: 'id' },
      )

      if (profileError) return json({ error: profileError.message }, 500)

      return json({
        admin: {
          id: userId,
          email,
          firstName,
          lastName,
          role: 'admin',
        },
      })
    }

    if (action === 'update') {
      const userId = String(body.userId ?? '')
      const firstName = body.firstName != null ? String(body.firstName).trim() : undefined
      const lastName = body.lastName != null ? String(body.lastName).trim() : undefined
      const email = body.email != null ? String(body.email).trim().toLowerCase() : undefined
      const password = body.password != null ? String(body.password) : undefined

      if (!userId) return json({ error: 'Missing staff user id.' }, 400)

      const { data: target, error: targetError } = await admin
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .maybeSingle()

      if (targetError || !target) return json({ error: 'That staff member was not found.' }, 404)
      if (target.role !== 'admin' && target.role !== 'super') {
        return json({ error: 'That account is not a staff member.' }, 400)
      }
      const editingSelf = userId === actorId
      if (target.role === 'super' && !editingSelf) {
        return json({ error: 'The super admin profile can only be edited by signing in as that account.' }, 403)
      }

      if (password !== undefined) {
        if (password.length < 8) return json({ error: 'Use at least 8 characters for the password.' }, 400)
        const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password })
        if (passwordError) return json({ error: passwordError.message }, 400)
      }

      const patch: Record<string, string> = {}
      if (firstName) patch.first_name = firstName
      if (lastName) patch.last_name = lastName
      if (email) patch.email = email

      if (Object.keys(patch).length > 0) {
        const { error: profileError } = await admin.from('profiles').update(patch).eq('id', userId)
        if (profileError) return json({ error: profileError.message }, 400)
        if (email) {
          const { error: emailError } = await admin.auth.admin.updateUserById(userId, { email })
          if (emailError) return json({ error: emailError.message }, 400)
        }
      }

      return json({ ok: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin-staff]', message)
    return json({ error: message }, 500)
  }
})
