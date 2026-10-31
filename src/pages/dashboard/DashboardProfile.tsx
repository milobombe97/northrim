import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { accountSettings } from '../../auth/session'
import { useAccount } from '../../auth/useAccount'
import { Button } from '../../components/Button'
import { Glyph, type FieldIconName } from '../../components/PasswordInput'

export function DashboardProfile() {
  const account = useAccount()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  if (!account) return null

  const status =
    account.kycStatus === 'verified'
      ? 'Verified'
      : account.kycStatus === 'in_review'
        ? 'In review'
        : account.kycStatus === 'rejected'
          ? 'Declined'
          : 'Not started'
  const alerts = accountSettings(account).notifications
  const alertSummary = [
    alerts.payments ? 'Payments' : null,
    alerts.cardActivity ? 'Card activity' : null,
    alerts.marketing ? 'Offers' : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="max-w-3xl">
      <h1 className="text-3xl font-medium tracking-[-0.04em]">Profile</h1>
      <dl className="mt-8 divide-y divide-revolut-line overflow-hidden rounded-[1.5rem] bg-white">
        <Row icon="user" label="Name" value={`${account.firstName} ${account.lastName}`} />
        <Row icon="mail" label="Email" value={account.email} />
        <Row icon="phone" label="Mobile" value={account.phone} />
        <Row icon="shield" label="Identity check" value={status} />
        <Row icon="bell" label="Alerts" value={alertSummary || 'Off'} />
        {account.kyc && (
          <>
            <Row
              icon="card"
              label="Document"
              value={`${titleCase(account.kyc.documentType)} · ${account.kyc.documentNumber}`}
            />
            <Row
              icon="home"
              label="Address"
              value={`${account.kyc.addressLine}, ${account.kyc.city} ${account.kyc.postcode}`}
            />
          </>
        )}
      </dl>
      {account.kycStatus === 'rejected' && (
        <div className="mt-4 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm text-red-950">
          <p className="font-medium">Identity check was declined</p>
          {account.kyc?.rejectionReason ? <p className="mt-1">{account.kyc.rejectionReason}</p> : null}
          <Link to="/kyc" className="mt-3 inline-flex rounded-full bg-revolut-ink px-4 py-2 text-sm font-medium text-white">Resubmit identity check</Link>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/dashboard/settings"
          className="inline-flex items-center justify-center rounded-full border border-revolut-line bg-white px-6 py-3 text-sm font-medium text-revolut-ink hover:bg-revolut-muted"
        >
          Profile settings
        </Link>
        <Button
          variant="secondary"
          onClick={() => {
            void signOut().then(() => navigate('/signin'))
          }}
        >
          Log out
        </Button>
      </div>
    </main>
  )
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Row({ icon, label, value }: { icon: FieldIconName; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
      <dt className="flex items-center gap-2 text-revolut-ink/50">
        <Glyph name={icon} className="size-4 shrink-0" />
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
