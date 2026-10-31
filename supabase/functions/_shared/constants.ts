function env(key: string, fallback: string): string {
  const value = Deno.env.get(key)?.trim()
  return value || fallback
}

/** North Rim Inc. — isolated Supabase project (northrimbankinc.com). */
export const ADMIN_EMAIL = env('ADMIN_EMAIL', 'info@northrimbankinc.com')
export const FROM_EMAIL = env('FROM_EMAIL', 'North Rim Inc. <info@northrimbankinc.com>')
export const REPLY_TO_EMAIL = env('REPLY_TO_EMAIL', 'info@northrimbankinc.com')
export const APP_NAME = env('APP_NAME', 'North Rim Inc')
export const SUPPORT_EMAIL = env('SUPPORT_EMAIL', 'info@northrimbankinc.com')
export const COMPANY_WEB_URL = env('COMPANY_WEB_URL', 'https://northrimbankinc.com')
export const REGISTERED_POSTAL_ADDRESS = env(
  'REGISTERED_POSTAL_ADDRESS',
  'North Rim Inc., United States',
)
const companyBase = COMPANY_WEB_URL.replace(/\/$/, '')
export const DASHBOARD_URL = env('DASHBOARD_URL', `${companyBase}/dashboard`)
