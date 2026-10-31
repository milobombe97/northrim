import { APP_NAME, DASHBOARD_URL } from '../constants.ts'
import { formatMoney, escapeHtml, formatTransferTimestamp, maskEmail } from '../format.ts'
import { detailsTable, detailRow, renderEmailLayout, statusPill } from './layout.ts'

export type TransferPartyInfo = {
  displayName: string
  email: string
  accountLabel: string
  /** When true, email is shown in full (admin notices). */
  showFullEmail?: boolean
}

export type TransferNoticeContext = {
  referenceId: string
  amount: number
  currency: string
  description: string
  status: 'pending' | 'completed'
  initiatedAt: string
  sender: TransferPartyInfo
  receiver: TransferPartyInfo
}

function partyContact(party: TransferPartyInfo) {
  return party.showFullEmail ? party.email : maskEmail(party.email)
}

function transferComplianceFooter(referenceId: string) {
  return `<p style="margin:0 0 12px;font-size:12px;line-height:1.55;color:#64748b;">
    <strong>Security notice:</strong> ${escapeHtml(APP_NAME)} will never ask for your password, PIN, or full card number by email.
    If you did not authorize this transfer, contact us immediately and quote reference <strong>${escapeHtml(referenceId)}</strong>.
    Posted balances may update only after verification where applicable. Timestamps are shown in UTC.
  </p>`
}

function transferDetailsBlock(ctx: TransferNoticeContext, viewer: 'sender' | 'receiver' | 'admin') {
  const statusLabel = ctx.status === 'pending' ? 'Pending verification' : 'Completed'
  const statusTone = ctx.status === 'pending' ? 'warning' : 'success'
  const senderContact = partyContact({
    ...ctx.sender,
    showFullEmail: viewer === 'admin' || viewer === 'sender',
  })
  const receiverContact = partyContact({
    ...ctx.receiver,
    showFullEmail: viewer === 'admin' || viewer === 'receiver',
  })

  return `
    <p>${statusPill(statusLabel, statusTone)}</p>
    ${detailsTable(
      detailRow('Reference', ctx.referenceId) +
        detailRow('Date and time', formatTransferTimestamp(ctx.initiatedAt)) +
        detailRow('Amount', formatMoney(Math.abs(ctx.amount), ctx.currency)) +
        detailRow('Currency', ctx.currency) +
        detailRow('Description', ctx.description) +
        detailRow('Sender name', ctx.sender.displayName) +
        detailRow('Sender account', ctx.sender.accountLabel) +
        detailRow('Sender contact', senderContact) +
        detailRow('Recipient name', ctx.receiver.displayName) +
        detailRow('Recipient account', ctx.receiver.accountLabel) +
        detailRow('Recipient contact', receiverContact),
    )}
  `
}

export function transferSenderNoticeEmail(ctx: TransferNoticeContext) {
  const pending = ctx.status === 'pending'
  return {
    subject: pending ? 'Transfer submitted for review' : 'Transfer sent — confirmation',
    html: renderEmailLayout({
      preheader: pending
        ? `Transfer to ${ctx.receiver.displayName} is pending verification.`
        : `You sent ${formatMoney(Math.abs(ctx.amount), ctx.currency)} to ${ctx.receiver.displayName}.`,
      title: pending ? 'Outgoing transfer received' : 'Transfer sent',
      bodyHtml: `
        <p>Hello ${escapeHtml(ctx.sender.displayName)},</p>
        <p>${
          pending
            ? `We received your transfer request of <strong>${formatMoney(Math.abs(ctx.amount), ctx.currency)}</strong> to <strong>${escapeHtml(ctx.receiver.displayName)}</strong>. Funds will move after North Rim Inc completes verification.`
            : `Your transfer of <strong>${formatMoney(Math.abs(ctx.amount), ctx.currency)}</strong> to <strong>${escapeHtml(ctx.receiver.displayName)}</strong> has been completed.`
        }</p>
        ${transferDetailsBlock(ctx, 'sender')}
      `,
      footerHtml: transferComplianceFooter(ctx.referenceId),
      referenceId: ctx.referenceId,
      ctaLabel: 'View activity',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function transferReceiverNoticeEmail(ctx: TransferNoticeContext) {
  const pending = ctx.status === 'pending'
  return {
    subject: pending ? 'Incoming transfer pending' : 'Money received — confirmation',
    html: renderEmailLayout({
      preheader: pending
        ? `${ctx.sender.displayName} sent you funds pending verification.`
        : `You received ${formatMoney(ctx.amount, ctx.currency)} from ${ctx.sender.displayName}.`,
      title: pending ? 'Incoming transfer pending' : 'Incoming transfer',
      bodyHtml: `
        <p>Hello ${escapeHtml(ctx.receiver.displayName)},</p>
        <p>${
          pending
            ? `<strong>${escapeHtml(ctx.sender.displayName)}</strong> initiated a transfer of <strong>${formatMoney(Math.abs(ctx.amount), ctx.currency)}</strong> to your account. It is <strong>pending verification</strong> and will appear on your balance once approved.`
            : `You received <strong>${formatMoney(ctx.amount, ctx.currency)}</strong> from <strong>${escapeHtml(ctx.sender.displayName)}</strong>.`
        }</p>
        ${transferDetailsBlock(ctx, 'receiver')}
      `,
      footerHtml: transferComplianceFooter(ctx.referenceId),
      referenceId: ctx.referenceId,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function transferAdminNoticeEmail(ctx: TransferNoticeContext) {
  const pending = ctx.status === 'pending'
  return {
    subject: pending ? 'Admin: transfer pending verification' : 'Admin: transfer completed',
    html: renderEmailLayout({
      title: pending ? 'Transfer awaiting approval' : 'Transfer posted',
      bodyHtml: `
        <p>A customer transfer was recorded on North Rim Inc</p>
        ${transferDetailsBlock(
          {
            ...ctx,
            sender: { ...ctx.sender, showFullEmail: true },
            receiver: { ...ctx.receiver, showFullEmail: true },
          },
          'admin',
        )}
      `,
      footerHtml: transferComplianceFooter(ctx.referenceId),
      referenceId: ctx.referenceId,
    }),
  }
}

export function internalTransferNoticeEmail(
  ctx: Omit<TransferNoticeContext, 'receiver'> & { receiverAccountLabel: string },
) {
  return {
    subject: 'Transfer between your accounts',
    html: renderEmailLayout({
      title: 'Internal transfer completed',
      bodyHtml: `
        <p>Hello ${escapeHtml(ctx.sender.displayName)},</p>
        <p>You moved <strong>${formatMoney(Math.abs(ctx.amount), ctx.currency)}</strong> between your North Rim Inc accounts.</p>
        ${detailsTable(
          detailRow('Reference', ctx.referenceId) +
            detailRow('Date and time', formatTransferTimestamp(ctx.initiatedAt)) +
            detailRow('Amount', formatMoney(Math.abs(ctx.amount), ctx.currency)) +
            detailRow('From account', ctx.sender.accountLabel) +
            detailRow('To account', ctx.receiverAccountLabel) +
            detailRow('Description', ctx.description),
        )}
        <p>${statusPill('Completed', 'success')}</p>
      `,
      footerHtml: transferComplianceFooter(ctx.referenceId),
      referenceId: ctx.referenceId,
      ctaLabel: 'View accounts',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

/** @deprecated Use transferSenderNoticeEmail */
export function transferSenderEmail(amount: number, currency: string, counterparty: string, description: string) {
  return transferSenderNoticeEmail({
    referenceId: '—',
    amount,
    currency,
    description,
    status: 'completed',
    initiatedAt: new Date().toISOString(),
    sender: { displayName: 'You', email: '', accountLabel: '—' },
    receiver: { displayName: counterparty, email: counterparty, accountLabel: '—' },
  })
}

/** @deprecated Use transferReceiverNoticeEmail */
export function transferReceiverEmail(amount: number, currency: string, sender: string, description: string) {
  return transferReceiverNoticeEmail({
    referenceId: '—',
    amount,
    currency,
    description,
    status: 'completed',
    initiatedAt: new Date().toISOString(),
    sender: { displayName: sender, email: sender, accountLabel: '—' },
    receiver: { displayName: 'You', email: '', accountLabel: '—' },
  })
}

/** @deprecated Use transferAdminNoticeEmail */
export function transferAdminEmail(
  senderEmail: string,
  receiverEmail: string,
  amount: number,
  currency: string,
  description: string,
) {
  return transferAdminNoticeEmail({
    referenceId: '—',
    amount,
    currency,
    description,
    status: 'completed',
    initiatedAt: new Date().toISOString(),
    sender: { displayName: senderEmail, email: senderEmail, accountLabel: '—', showFullEmail: true },
    receiver: { displayName: receiverEmail, email: receiverEmail, accountLabel: '—', showFullEmail: true },
  })
}

/** @deprecated Use internalTransferNoticeEmail */
export function internalTransferEmail(amount: number, currency: string, description: string) {
  return internalTransferNoticeEmail({
    referenceId: '—',
    amount: -amount,
    currency,
    description,
    status: 'completed',
    initiatedAt: new Date().toISOString(),
    sender: { displayName: 'You', email: '', accountLabel: '—' },
    receiverAccountLabel: '—',
  })
}

export function welcomeEmail(name: string) {
  const safeName = name.trim() || 'there'
  return {
    subject: 'Welcome to North Rim Inc',
    html: renderEmailLayout({
      preheader: 'Your North Rim account is ready.',
      title: 'Welcome aboard',
      bodyHtml: `
        <p>Hi ${escapeHtml(safeName)},</p>
        <p>Thanks for joining <strong>North Rim Inc</strong> Your account is ready. Complete identity verification when you are ready to unlock the full dashboard.</p>
        <p>We keep your money and data protected with review workflows for top-ups, transfers, and withdrawals.</p>
      `,
      ctaLabel: 'Open dashboard',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function kycSubmittedEmail() {
  return {
    subject: 'Identity check received',
    html: renderEmailLayout({
      preheader: 'We are reviewing your documents.',
      title: 'KYC submitted',
      bodyHtml: `
        <p>We received your identity documents and proof of address.</p>
        <p>${statusPill('In review', 'warning')}</p>
        <p>Our team will review your submission shortly. You will receive another email when a decision is made.</p>
      `,
      ctaLabel: 'View status',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function kycSubmittedAdminEmail(email: string, idType: string) {
  return {
    subject: 'New KYC submission',
    html: renderEmailLayout({
      title: 'KYC awaiting review',
      bodyHtml: `
        <p>A customer submitted identity documents for review.</p>
        ${detailsTable(detailRow('Customer', email) + detailRow('Document type', idType))}
      `,
    }),
  }
}

export function kycDecisionEmail(approved: boolean, reason?: string) {
  return {
    subject: approved ? 'Identity verified' : 'Identity check update',
    html: renderEmailLayout({
      preheader: approved ? 'Your identity is verified.' : 'We need you to resubmit.',
      title: approved ? 'KYC approved' : 'KYC not approved',
      bodyHtml: approved
        ? `<p>Your identity check is complete. ${statusPill('Verified', 'success')}</p><p>You now have full access to North Rim Inc banking features.</p>`
        : `<p>We could not approve your identity check. ${statusPill('Rejected', 'danger')}</p>
           ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
           <p>Sign in to resubmit corrected documents.</p>`,
      ctaLabel: 'Open dashboard',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function receiptSubmittedEmail(amount: number, currency: string) {
  return {
    subject: 'Top-up receipt received',
    html: renderEmailLayout({
      preheader: 'Your top-up is pending review.',
      title: 'Receipt submitted',
      bodyHtml: `
        <p>We received your top-up receipt for <strong>${formatMoney(amount, currency)}</strong>.</p>
        <p>${statusPill('Pending review', 'warning')}</p>
        <p>Your balance will update after our team approves the payment.</p>
      `,
      ctaLabel: 'View activity',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function receiptSubmittedAdminEmail(email: string, amount: number, currency: string) {
  return {
    subject: 'New top-up receipt to review',
    html: renderEmailLayout({
      title: 'Receipt awaiting approval',
      bodyHtml: `
        <p>A customer uploaded a receipt for a top-up.</p>
        ${detailsTable(detailRow('Customer', email) + detailRow('Amount', formatMoney(amount, currency)))}
      `,
    }),
  }
}

export function receiptDecisionEmail(approved: boolean, amount: number, currency: string, reason?: string) {
  return {
    subject: approved ? 'Top-up approved' : 'Top-up receipt declined',
    html: renderEmailLayout({
      title: approved ? 'Receipt approved' : 'Receipt declined',
      bodyHtml: approved
        ? `<p>Your top-up of <strong>${formatMoney(amount, currency)}</strong> was approved. ${statusPill('Credited', 'success')}</p><p>The funds are now on your account balance.</p>`
        : `<p>Your top-up receipt was declined. ${statusPill('Declined', 'danger')}</p>
           ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}`,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function adminBalanceAdjustEmail(amount: number, currency: string, direction: 'fund' | 'defund') {
  const funded = direction === 'fund'
  return {
    subject: funded ? 'Balance updated' : 'Balance adjustment',
    html: renderEmailLayout({
      title: funded ? 'Funds added to your account' : 'Funds removed from your account',
      bodyHtml: funded
        ? `<p><strong>${formatMoney(amount, currency)}</strong> was added to your account by North Rim Inc ${statusPill('Credited', 'success')}</p>`
        : `<p><strong>${formatMoney(amount, currency)}</strong> was removed from your account by North Rim Inc ${statusPill('Debited', 'warning')}</p>`,
      ctaLabel: 'View balance',
      ctaHref: DASHBOARD_URL,
    }),
  }
}

export function adminBalanceAdjustAdminEmail(
  customerEmail: string,
  amount: number,
  currency: string,
  direction: 'fund' | 'defund',
) {
  return {
    subject: direction === 'fund' ? 'Admin: client balance funded' : 'Admin: client balance reduced',
    html: renderEmailLayout({
      title: direction === 'fund' ? 'Balance funded' : 'Balance reduced',
      bodyHtml: `
        <p>Staff adjusted a client balance.</p>
        ${detailsTable(
          detailRow('Customer', customerEmail) +
            detailRow('Direction', direction === 'fund' ? 'Fund' : 'Defund') +
            detailRow('Amount', formatMoney(amount, currency)),
        )}
      `,
    }),
  }
}

export function accountSuspendedEmail() {
  return {
    subject: 'Account suspended',
    html: renderEmailLayout({
      title: 'Account suspended',
      bodyHtml: `
        <p>Your North Rim Inc account has been suspended. ${statusPill('Suspended', 'warning')}</p>
        <p>You cannot sign in or move money until an administrator reactivates your account. Contact ${escapeHtml('info@nevoluteinc.com')} if you need help.</p>
      `,
    }),
  }
}

export function accountDeletedEmail() {
  return {
    subject: 'Account closed',
    html: renderEmailLayout({
      title: 'Account closed',
      bodyHtml: `
        <p>Your North Rim Inc account has been closed. ${statusPill('Closed', 'neutral')}</p>
        <p>You will no longer be able to access this account. Contact support if you believe this was a mistake.</p>
      `,
    }),
  }
}

export function accountStatusAdminEmail(email: string, status: 'suspended' | 'deleted') {
  return {
    subject: `Customer account ${status}`,
    html: renderEmailLayout({
      title: `Account ${status}`,
      bodyHtml: `
        <p>A customer profile status was updated.</p>
        ${detailsTable(detailRow('Email', email) + detailRow('Status', status))}
      `,
    }),
  }
}
