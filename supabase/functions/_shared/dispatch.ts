import {
  accountDeletedEmail,
  accountStatusAdminEmail,
  accountSuspendedEmail,
  internalTransferNoticeEmail,
  kycDecisionEmail,
  kycSubmittedAdminEmail,
  kycSubmittedEmail,
  receiptDecisionEmail,
  receiptSubmittedAdminEmail,
  receiptSubmittedEmail,
  adminBalanceAdjustAdminEmail,
  adminBalanceAdjustEmail,
  transferAdminNoticeEmail,
  transferReceiverNoticeEmail,
  transferSenderNoticeEmail,
  type TransferNoticeContext,
  welcomeEmail,
} from './templates/messages.ts'
import { sendAdminOnly, sendEmail } from './resend.ts'
import { profileDisplayName } from './format.ts'
import { getAccountCurrency, getAccountLabel, getProfile, getTransaction, type ProfileRow } from './supabase-admin.ts'

async function buildP2PContext(
  record: Record<string, unknown>,
  status: 'pending' | 'completed',
): Promise<{ ctx: TransferNoticeContext } | { error: string }> {
  const txId = String(record.id ?? '')
  const amount = Number(record.amount)
  const userId = String(record.user_id)
  const accountCode = String(record.account_id ?? 'usd')
  const sender = await getProfile(userId)
  if (!sender?.email) return { error: 'missing sender' }

  const incoming = await getTransaction(`${txId}-in`)
  if (!incoming) return { error: 'missing incoming leg' }

  const receiver = await getProfile(incoming.user_id)
  if (!receiver?.email) return { error: 'missing receiver' }

  const currency = await getAccountCurrency(userId, accountCode)
  const senderAccount = await getAccountLabel(userId, accountCode)
  const receiverAccount = await getAccountLabel(incoming.user_id, incoming.account_id)

  const initiatedAt = String(record.created_at ?? record.updated_at ?? new Date().toISOString())

  return {
    ctx: {
      referenceId: txId,
      amount,
      currency,
      description: String(record.name ?? 'Transfer'),
      status,
      initiatedAt,
      sender: {
        displayName: profileDisplayName(sender),
        email: sender.email,
        accountLabel: senderAccount,
      },
      receiver: {
        displayName: profileDisplayName(receiver),
        email: receiver.email,
        accountLabel: receiverAccount,
      },
    },
  }
}

async function sendP2PTransferEmails(ctx: TransferNoticeContext) {
  const senderMsg = transferSenderNoticeEmail(ctx)
  const receiverMsg = transferReceiverNoticeEmail({ ...ctx, amount: Math.abs(ctx.amount) })
  const adminMsg = transferAdminNoticeEmail(ctx)
  const meta = { category: 'transfer', referenceId: ctx.referenceId }
  await sendEmail({ to: ctx.sender.email, subject: senderMsg.subject, html: senderMsg.html, ...meta })
  await sendEmail({ to: ctx.receiver.email, subject: receiverMsg.subject, html: receiverMsg.html, ...meta })
  await sendAdminOnly({ subject: adminMsg.subject, html: adminMsg.html, ...meta })
}

async function dispatchPendingFromIncoming(incomingRecord: Record<string, unknown>) {
  const inId = String(incomingRecord.id ?? '')
  if (!inId.endsWith('-in')) return { handled: false as const, reason: 'not incoming leg' }
  const outId = inId.slice(0, -3)
  const outgoing = await getTransaction(outId)
  if (!outgoing) return { handled: false as const, reason: 'outgoing missing' }
  const built = await buildP2PContext(outgoing as unknown as Record<string, unknown>, 'pending')
  if ('error' in built) return { handled: false as const, reason: built.error }
  await sendP2PTransferEmails(built.ctx)
  return { handled: true as const, event: 'transfer_p2p_pending' }
}

/** Instant P2P inserts outgoing then incoming; email runs after the incoming row exists. */
async function dispatchCompletedFromIncoming(incomingRecord: Record<string, unknown>) {
  const inId = String(incomingRecord.id ?? '')
  if (!inId.endsWith('-in')) return { handled: false as const, reason: 'not incoming leg' }
  const outId = inId.slice(0, -3)
  const outgoing = await getTransaction(outId)
  if (!outgoing) return { handled: false as const, reason: 'outgoing missing' }
  const built = await buildP2PContext(outgoing as unknown as Record<string, unknown>, 'completed')
  if ('error' in built) return { handled: false as const, reason: built.error }
  await sendP2PTransferEmails(built.ctx)
  return { handled: true as const, event: 'transfer_p2p' }
}

async function dispatchTransfer(record: Record<string, unknown>, status: 'pending' | 'completed') {
  const txId = String(record.id ?? '')
  const amount = Number(record.amount)
  const userId = String(record.user_id)
  if (txId.endsWith('-in')) return { handled: false as const, reason: 'incoming leg skipped' }
  if (amount >= 0) return { handled: false as const, reason: 'not outgoing leg' }

  const incoming = await getTransaction(`${txId}-in`)
  if (incoming) {
    if (incoming.user_id === userId) {
      const sender = await getProfile(userId)
      if (!sender?.email) return { handled: false as const, reason: 'missing sender' }
      const currency = await getAccountCurrency(userId, String(record.account_id ?? 'usd'))
      const senderAccount = await getAccountLabel(userId, String(record.account_id ?? 'usd'))
      const receiverAccount = await getAccountLabel(incoming.user_id, incoming.account_id)
      const internalMsg = internalTransferNoticeEmail({
        referenceId: txId,
        amount,
        currency,
        description: String(record.name ?? 'Transfer'),
        status: 'completed',
        initiatedAt: String(record.created_at ?? new Date().toISOString()),
        sender: {
          displayName: profileDisplayName(sender),
          email: sender.email,
          accountLabel: senderAccount,
        },
        receiverAccountLabel: receiverAccount,
      })
      await sendEmail({
        to: sender.email,
        subject: internalMsg.subject,
        html: internalMsg.html,
        ccAdmin: true,
        category: 'transfer_internal',
        referenceId: txId,
      })
      return { handled: true as const, event: 'transfer_internal' }
    }

    const built = await buildP2PContext(record, status)
    if ('error' in built) return { handled: false as const, reason: built.error }
    await sendP2PTransferEmails(built.ctx)
    return { handled: true as const, event: status === 'completed' ? 'transfer_p2p' : 'transfer_p2p_pending' }
  }

  return { handled: false as const, reason: 'transfer pair not found' }
}

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema?: string
  record: Record<string, unknown>
  old_record?: Record<string, unknown> | null
}

function tableName(table: string) {
  return table.includes('.') ? table.split('.').pop()! : table
}

function profileName(profile: ProfileRow | null) {
  if (!profile) return 'Customer'
  return profileDisplayName(profile)
}

export async function dispatchTransactionalEmail(payload: WebhookPayload) {
  const table = tableName(payload.table)
  const record = payload.record
  const old = payload.old_record ?? null

  if (table === 'profiles') {
    if (payload.type === 'INSERT') {
      const email = String(record.email ?? '')
      if (!email) return { handled: false, reason: 'missing email' }
      const msg = welcomeEmail(profileName(record as ProfileRow))
      await sendEmail({
        to: email,
        subject: msg.subject,
        html: msg.html,
        ccAdmin: true,
        category: 'welcome',
        referenceId: String(record.id ?? ''),
      })
      return { handled: true, event: 'welcome' }
    }

    if (payload.type === 'UPDATE') {
      const next = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (next === prev) return { handled: false, reason: 'status unchanged' }
      const email = String(record.email ?? '')
      if (!email) return { handled: false, reason: 'missing email' }

      if (next === 'suspended' && prev !== 'suspended') {
        const msg = accountSuspendedEmail()
        await sendEmail({ to: email, subject: msg.subject, html: msg.html, ccAdmin: true, category: 'account_status' })
        const admin = accountStatusAdminEmail(email, 'suspended')
        await sendAdminOnly({ ...admin, category: 'account_status_admin' })
        return { handled: true, event: 'account_suspended' }
      }

      if (next === 'deleted' && prev !== 'deleted') {
        const msg = accountDeletedEmail()
        await sendEmail({ to: email, subject: msg.subject, html: msg.html, ccAdmin: true, category: 'account_status' })
        const admin = accountStatusAdminEmail(email, 'deleted')
        await sendAdminOnly({ ...admin, category: 'account_status_admin' })
        return { handled: true, event: 'account_deleted' }
      }
    }
  }

  if (table === 'kyc_submissions') {
    if (payload.type === 'INSERT') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const userMsg = kycSubmittedEmail()
      await sendEmail({ to: profile.email, subject: userMsg.subject, html: userMsg.html, ccAdmin: true, category: 'kyc' })
      const adminMsg = kycSubmittedAdminEmail(profile.email, String(record.id_type ?? 'ID'))
      await sendAdminOnly({ ...adminMsg, category: 'kyc_admin', referenceId: String(record.id ?? '') })
      return { handled: true, event: 'kyc_submitted' }
    }

    if (payload.type === 'UPDATE') {
      const status = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (status === prev || (status !== 'approved' && status !== 'rejected')) {
        return { handled: false, reason: 'not a decision update' }
      }
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const approved = status === 'approved'
      const msg = kycDecisionEmail(approved, String(record.rejection_reason ?? '') || undefined)
      await sendEmail({
        to: profile.email,
        subject: msg.subject,
        html: msg.html,
        ccAdmin: true,
        category: 'kyc',
        referenceId: String(record.id ?? ''),
      })
      return { handled: true, event: approved ? 'kyc_approved' : 'kyc_rejected' }
    }
  }

  if (table === 'receipts') {
    if (payload.type === 'INSERT') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const amount = Number(record.amount)
      const currency = String(record.currency ?? 'USD')
      const userMsg = receiptSubmittedEmail(amount, currency)
      await sendEmail({ to: profile.email, subject: userMsg.subject, html: userMsg.html, ccAdmin: true, category: 'receipt', referenceId: String(record.id ?? '') })
      const adminMsg = receiptSubmittedAdminEmail(profile.email, amount, currency)
      await sendAdminOnly({ ...adminMsg, category: 'receipt_admin', referenceId: String(record.id ?? '') })
      return { handled: true, event: 'receipt_submitted' }
    }

    if (payload.type === 'UPDATE') {
      const status = String(record.status ?? '')
      const prev = String(old?.status ?? '')
      if (status === prev || (status !== 'approved' && status !== 'rejected')) {
        return { handled: false, reason: 'not a decision update' }
      }
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const amount = Number(record.amount)
      const currency = String(record.currency ?? 'USD')
      const approved = status === 'approved'
      const msg = receiptDecisionEmail(
        approved,
        amount,
        currency,
        String(record.rejection_reason ?? '') || undefined,
      )
      await sendEmail({
        to: profile.email,
        subject: msg.subject,
        html: msg.html,
        ccAdmin: true,
        category: 'receipt',
        referenceId: String(record.id ?? ''),
      })
      return { handled: true, event: approved ? 'receipt_approved' : 'receipt_rejected' }
    }
  }

  if (table === 'transactions' && payload.type === 'INSERT') {
    const category = String(record.category ?? '')
    const status = String(record.status ?? '')
    const amount = Number(record.amount)
    const method = String(record.method ?? '')
    const txId = String(record.id ?? '')

    if (method === 'Admin' && status === 'approved') {
      const userId = String(record.user_id)
      const profile = await getProfile(userId)
      if (!profile?.email) return { handled: false, reason: 'missing profile' }
      const currency = await getAccountCurrency(userId, String(record.account_id ?? 'usd'))
      if (amount > 0) {
        const msg = receiptDecisionEmail(true, amount, currency)
        await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true, category: 'admin_balance', referenceId: txId })
        const adminMsg = adminBalanceAdjustAdminEmail(profile.email, amount, currency, 'fund')
        await sendAdminOnly({ ...adminMsg, category: 'admin_balance', referenceId: txId })
        return { handled: true, event: 'admin_fund' }
      }
      if (amount < 0) {
        const msg = adminBalanceAdjustEmail(Math.abs(amount), currency, 'defund')
        await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html, ccAdmin: true, category: 'admin_balance', referenceId: txId })
        const adminMsg = adminBalanceAdjustAdminEmail(profile.email, Math.abs(amount), currency, 'defund')
        await sendAdminOnly({ ...adminMsg, category: 'admin_balance', referenceId: txId })
        return { handled: true, event: 'admin_defund' }
      }
      return { handled: false, reason: 'zero amount' }
    }

    if (category === 'Transfer' && status === 'pending') {
      if (txId.endsWith('-in')) {
        return await dispatchPendingFromIncoming(record)
      }
      return { handled: false, reason: 'await incoming leg' }
    }
    if (category === 'Transfer' && status === 'approved') {
      if (txId.endsWith('-in')) {
        return await dispatchCompletedFromIncoming(record)
      }
      return { handled: false, reason: 'await incoming leg for email' }
    }
    return { handled: false, reason: 'not transfer' }
  }

  if (table === 'transactions' && payload.type === 'UPDATE') {
    const category = String(record.category ?? '')
    const status = String(record.status ?? '')
    const prev = String(old?.status ?? '')
    if (category !== 'Transfer' || status !== 'approved' || prev === 'approved') {
      return { handled: false, reason: 'not transfer approval' }
    }
    return await dispatchTransfer(record, 'completed')
  }

  return { handled: false, reason: 'no matching event' }
}
