# One-time setup for North Rim transactional email (Supabase Edge + Resend).
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/setup-transactional-email.ps1
# Do not commit this file with real keys filled in.

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$webhookSecret = 'nr-email-webhook-7Kp2mQx9Vf4Lw8Hd3Jn6Rs1Ty0Ub5Zc'

Write-Host 'Paste your Resend API key (re_...), then Enter:'
$resendKey = Read-Host -AsSecureString
$resendPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($resendKey)
)

Write-Host 'Paste Supabase service_role key from Dashboard -> Settings -> API, then Enter:'
$servicePlain = Read-Host -AsSecureString
$servicePlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($servicePlain)
)

npx supabase link --project-ref zgixrjmjhyyivdxwwvvc --yes | Out-Null

npx supabase secrets set `
  "RESEND_API_KEY=$resendPlain" `
  "EMAIL_WEBHOOK_SECRET=$webhookSecret" `
  "SUPABASE_SERVICE_ROLE_KEY=$servicePlain" `
  "SUPABASE_URL=https://zgixrjmjhyyivdxwwvvc.supabase.co" `
  "FROM_EMAIL=North Rim Inc. <info@northrimbankinc.com>" `
  "REPLY_TO_EMAIL=info@northrimbankinc.com" `
  "ADMIN_EMAIL=info@northrimbankinc.com" `
  "COMPANY_WEB_URL=https://www.northrimbankinc.com" `
  "DASHBOARD_URL=https://www.northrimbankinc.com/dashboard"

npx supabase functions deploy transactional-email --no-verify-jwt
npx supabase db query --linked -f supabase/scripts/configure-email-dispatch.local.sql

Write-Host 'Done. Test in Supabase Edge Function logs and Resend -> Emails.'
Write-Host "Webhook secret in DB matches: $webhookSecret"
