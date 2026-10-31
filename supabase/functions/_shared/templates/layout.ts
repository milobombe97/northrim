import { APP_NAME, COMPANY_WEB_URL, REGISTERED_POSTAL_ADDRESS, SUPPORT_EMAIL } from '../constants.ts'
import { escapeHtml } from '../format.ts'

export type LayoutOptions = {
  preheader?: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaHref?: string
  footerHtml?: string
  referenceId?: string
}

function institutionalHtmlFooter(referenceId?: string) {
  const ref = referenceId
    ? `<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">Reference: ${escapeHtml(referenceId)}</p>`
    : ''
  return `${ref}
<p style="margin:16px 0 0;font-size:11px;line-height:1.55;color:#94a3b8;">
  <strong>${escapeHtml(APP_NAME)}</strong><br />
  ${escapeHtml(REGISTERED_POSTAL_ADDRESS)}<br />
  <a href="${escapeHtml(COMPANY_WEB_URL)}" style="color:#64748b;">${escapeHtml(COMPANY_WEB_URL)}</a>
</p>
<p style="margin:12px 0 0;font-size:11px;line-height:1.55;color:#94a3b8;">
  Confidential transactional notice for the intended account holder only. This is not a marketing message.
  Misdirected mail? Contact <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#64748b;">${escapeHtml(SUPPORT_EMAIL)}</a> and delete this email.
</p>`
}

export function renderEmailLayout(options: LayoutOptions) {
  const title = escapeHtml(options.title)
  const preheader = escapeHtml(options.preheader ?? options.title)
  const cta =
    options.ctaLabel && options.ctaHref
      ? `<p style="margin:28px 0 0;text-align:center;">
          <a href="${escapeHtml(options.ctaHref)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">${escapeHtml(options.ctaLabel)}</a>
        </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:28px 32px 12px;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#ffffff;">
              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">${escapeHtml(APP_NAME)}</p>
              <h1 style="margin:10px 0 0;font-size:22px;font-weight:600;line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;line-height:1.65;color:#334155;">
              ${options.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#64748b;">
              ${options.footerHtml ?? ''}
              This is an automated transaction notice from ${escapeHtml(APP_NAME)}. If you did not expect this email, contact
              <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f172a;">${escapeHtml(SUPPORT_EMAIL)}</a>.
              ${institutionalHtmlFooter(options.referenceId)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function statusPill(label: string, tone: 'success' | 'warning' | 'danger' | 'neutral') {
  const colors = {
    success: { bg: '#ecfdf5', fg: '#047857' },
    warning: { bg: '#fffbeb', fg: '#b45309' },
    danger: { bg: '#fef2f2', fg: '#b91c1c' },
    neutral: { bg: '#f1f5f9', fg: '#334155' },
  }[tone]
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${colors.bg};color:${colors.fg};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(label)}</span>`
}

export function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`
}

export function detailsTable(rows: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 0;border-top:1px solid #e5e7eb;">${rows}</table>`
}
