import {
  APP_NAME,
  COMPANY_WEB_URL,
  REGISTERED_POSTAL_ADDRESS,
  REPLY_TO_EMAIL,
  SUPPORT_EMAIL,
} from './constants.ts'

/** RFC 5322 multipart/alternative plain part derived from HTML (transactional mirror). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function institutionalPlainFooter(referenceId?: string) {
  const ref = referenceId ? `\nReference: ${referenceId}` : ''
  return `${ref}

---
${APP_NAME}
${REGISTERED_POSTAL_ADDRESS}
${COMPANY_WEB_URL}

This is an automated transactional notice (not marketing). For help, reply to ${REPLY_TO_EMAIL} or email ${SUPPORT_EMAIL}.
Confidential: intended only for the account holder named in this message. If you received this in error, notify us and delete it.
We will never ask for your password, PIN, or full card number by email.`
}

export function buildPlainBody(html: string, referenceId?: string) {
  return `${htmlToPlainText(html)}\n\n${institutionalPlainFooter(referenceId)}`
}

/** Headers aligned with RFC 3834 auto-generated mail and financial transactional best practice. */
export function complianceHeaders(options: { category: string; referenceId?: string }) {
  const headers: Record<string, string> = {
    'Auto-Submitted': 'auto-generated',
    'X-Auto-Response-Suppress': 'All',
    'X-PM-Message-Stream': 'transactional',
    'List-Unsubscribe': `<mailto:${REPLY_TO_EMAIL}?subject=${encodeURIComponent('Notification preferences')}>`,
  }
  if (options.referenceId) {
    headers['X-Entity-Ref-ID'] = options.referenceId.slice(0, 128)
  }
  headers['X-Transaction-Category'] = options.category.slice(0, 64)
  return headers
}
