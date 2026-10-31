import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useAccount } from '../../auth/useAccount'
import { Button } from '../../components/Button'
import { AuthLayout } from './AuthLayout'

const statusCopy = {
  not_started: {
    title: 'Identity check needed',
    body: 'Finish the identity check before this North Rim Inc account can be marked ready.',
  },
  in_review: {
    title: 'Identity check submitted',
    body: 'North Rim Inc is reviewing this identity check.',
  },
  verified: {
    title: 'Identity verified',
    body: 'This North Rim Inc account is verified.',
  },
  rejected: {
    title: 'Identity check declined',
    body: 'North Rim Inc declined this identity check. Submit it again to continue.',
  },
} as const

export function AccountPage() {
  const account = useAccount()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  if (!account) return <Navigate to="/signin" replace />

  const status = statusCopy[account.kycStatus]

  return (
    <AuthLayout title={`Hello, ${account.firstName}`} subtitle={status.body}>
      <div className="rounded-3xl border border-revolut-line bg-revolut-muted/60 p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-revolut-ink/45">
          Account status
        </p>
        <p className="mt-2 text-2xl font-medium tracking-[-0.03em]">{status.title}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Name" value={`${account.firstName} ${account.lastName}`} />
          <Row label="Email" value={account.email} />
          <Row label="Mobile" value={account.phone} />
          {account.kyc && (
            <>
              <Row
                label="Document"
                value={`${labelFor(account.kyc.documentType)} · ${account.kyc.documentNumber}`}
              />
              <Row
                label="Address"
                value={`${account.kyc.addressLine}, ${account.kyc.city} ${account.kyc.postcode}`}
              />
            </>
          )}
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {account.kycStatus === 'not_started' && (
          <Button href="/kyc">Continue identity check</Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            void signOut().then(() => navigate('/signin'))
          }}
        >
          Log out
        </Button>
      </div>
    </AuthLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-revolut-ink/50">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function labelFor(type: 'passport' | 'driving_licence' | 'national_id') {
  if (type === 'driving_licence') return 'Driving licence'
  if (type === 'national_id') return 'National ID'
  return 'Passport'
}
