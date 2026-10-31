import { createClient } from '@supabase/supabase-js'

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const url = supabaseUrl
const key = supabaseAnonKey

export const supabase = url && key ? createClient(url, key) : null

export function supabaseEnabled() {
  return supabase !== null
}
