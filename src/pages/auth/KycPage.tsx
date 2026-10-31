import { type FormEvent, useState } from 'react'
import { readStoredFile, type StoredFile } from '../../data/files'
import { Navigate, useNavigate } from 'react-router-dom'
import { loadAccount, saveAccount, type KycProfile } from '../../auth/session'
import { storeKycDocuments, submitKycSubmission } from '../../data/remote'
import { Button } from '../../components/Button'
import { CountrySelect } from '../../components/CountrySelect'
import { Field } from '../../components/Field'
import { Glyph, IconText } from '../../components/PasswordInput'
import { SelectMenu } from '../../components/SelectMenu'
import { AuthLayout } from './AuthLayout'

const steps = ['Personal details', 'Identity document', 'Home address'] as const

const emptyKyc: KycProfile = {
  legalFirstName: '',
  legalLastName: '',
  dateOfBirth: '',
  nationality: 'United Kingdom',
  documentType: 'passport',
  documentNumber: '',
  documentExpiry: '',
  documentFileName: '',
  documentBackFileName: '',
  addressLine: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
}

function isAdult(isoDate: string) {
  const dob = new Date(isoDate)
  if (Number.isNaN(dob.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dob <= cutoff
}

export function KycPage() {
  const navigate = useNavigate()
  const account = loadAccount()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<KycProfile>(() => ({
    ...emptyKyc,
    legalFirstName: account?.firstName ?? '',
    legalLastName: account?.lastName ?? '',
    ...account?.kyc,
  }))
  const [error, setError] = useState('')

  if (!account?.signedIn) return <Navigate to="/signin" replace />
  if (account.kycStatus !== 'not_started' && account.kycStatus !== 'rejected') return <Navigate to="/dashboard" replace />

  function set<K extends keyof KycProfile>(key: K, value: KycProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function next(event: FormEvent) {
    event.preventDefault()
    if (step === 0) {
      if (form.legalFirstName.trim().length < 2 || form.legalLastName.trim().length < 2) {
        setError('Enter your legal name as it appears on your ID.')
        return
      }
      if (!isAdult(form.dateOfBirth)) {
        setError('You need to be 18 or older to open a North Rim Inc account.')
        return
      }
    }
    if (step === 1) {
      if (form.documentNumber.trim().length < 5) {
        setError('Enter the document number from your ID.')
        return
      }
      if (!form.documentExpiry) {
        setError('Enter the expiry date.')
        return
      }
      if (form.documentType === 'passport') {
        if (!form.documentFileName) {
          setError('Upload the biography page of your passport.')
          return
        }
      } else if (!form.documentFileName || !form.documentBackFileName) {
        setError('Upload the front and the back.')
        return
      }
      if (!form.selfieFileName) {
        setError('Upload a clear selfie so we can match your face to your ID.')
        return
      }
    }
    if (step === 2) {
      if (!form.addressLine.trim() || !form.city.trim() || !form.postcode.trim()) {
        setError('Enter your full home address.')
        return
      }
      if (!form.proofOfAddressFileName) {
        setError('Upload a recent bill or bank statement as proof of address.')
        return
      }
      try {
        const result = await submitKycSubmission(account!, form)
        if (result.error) {
          setError(result.error)
          return
        }
        const kyc = result.kyc ?? form
        const next = result.account ?? {
          ...account!,
          kyc: { ...kyc, rejectionReason: undefined },
          kycStatus: 'in_review' as const,
        }
        saveAccount(next)
      } catch {
        setError('The identity photos could not be saved. Use a photo or a PDF and try again.')
        return
      }
      navigate('/dashboard')
      return
    }
    setStep((current) => current + 1)
  }

  async function goBack() {
    try {
      const kyc = await storeKycDocuments(account!.id || 'primary', form)
      saveAccount({ ...account!, kyc, kycStatus: 'not_started' })
      setForm(kyc ?? form)
    } catch {
      setError('The identity photos could not be saved. Use a photo or a PDF and try again.')
      return
    }
    if (step === 0) {
      navigate('/signup')
      return
    }
    setStep((current) => current - 1)
  }

  return (
    <AuthLayout
      title={steps[step]}
      subtitle="Banks use these details to confirm you are who you say you are."
      step={{ current: step + 2, total: 4, label: 'Identity check' }}
      onBack={goBack}
    >
      <form className="space-y-4" onSubmit={next}>
        {account.kycStatus === 'rejected' && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-950">
            <p className="font-medium">This identity check was declined</p>
            <p className="mt-1">{account.kyc?.rejectionReason || 'Update the details and submit it again.'}</p>
          </div>
        )}
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal first name">
                <IconText
                  icon="user"
                  value={form.legalFirstName}
                  onChange={(event) => set('legalFirstName', event.target.value)}
                />
              </Field>
              <Field label="Legal last name">
                <IconText
                  icon="user"
                  value={form.legalLastName}
                  onChange={(event) => set('legalLastName', event.target.value)}
                />
              </Field>
            </div>
            <Field label="Date of birth">
              <IconText
                icon="calendar"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => set('dateOfBirth', event.target.value)}
              />
            </Field>
            <Field label="Nationality">
              <CountrySelect value={form.nationality} onChange={(value) => set('nationality', value)} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Document type">
              <SelectMenu
                value={form.documentType}
                onChange={(value) => {
                  const documentType = value as KycProfile['documentType']
                  setForm((current) => ({
                    ...current,
                    documentType,
                    documentFileName: '',
                    documentFile: undefined,
                    documentBackFileName: '',
                    documentBackFile: undefined,
                  }))
                  setError('')
                }}
                options={[
                  { value: 'passport', label: 'Passport', hint: 'Biography page', icon: <Glyph name="card" /> },
                  { value: 'driving_licence', label: 'Driving licence', hint: 'Front and back', icon: <Glyph name="card" /> },
                  { value: 'national_id', label: 'National ID card', hint: 'Front and back', icon: <Glyph name="shield" /> },
                ]}
              />
            </Field>
            <Field label="Document number">
              <IconText
                icon="hash"
                value={form.documentNumber}
                onChange={(event) => set('documentNumber', event.target.value)}
              />
            </Field>
            <Field label="Expiry date">
              <IconText
                icon="calendar"
                type="date"
                value={form.documentExpiry}
                onChange={(event) => set('documentExpiry', event.target.value)}
              />
            </Field>
            {form.documentType === 'passport' ? (
              <UploadField
                label="Biography page"
                hint="Upload the biography page of your passport."
                fileName={form.documentFileName}
                onFile={(file) => setForm((current) => ({ ...current, documentFileName: file.name, documentFile: file }))}
              />
            ) : (
              <>
                <UploadField
                  label="Front"
                  hint={`Upload the front of your ${form.documentType === 'driving_licence' ? 'driving licence' : 'ID'}.`}
                  fileName={form.documentFileName}
                  onFile={(file) => setForm((current) => ({ ...current, documentFileName: file.name, documentFile: file }))}
                />
                <UploadField
                  label="Back"
                  hint={`Upload the back of your ${form.documentType === 'driving_licence' ? 'driving licence' : 'ID'}.`}
                  fileName={form.documentBackFileName ?? ''}
                  onFile={(file) => setForm((current) => ({ ...current, documentBackFileName: file.name, documentBackFile: file }))}
                />
              </>
            )}
            <UploadField
              label="Selfie"
              hint="Hold your phone at eye level. No sunglasses or hats."
              fileName={form.selfieFileName ?? ''}
              onFile={(file) => setForm((current) => ({ ...current, selfieFileName: file.name, selfieFile: file }))}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Address line">
              <IconText
                icon="home"
                autoComplete="address-line1"
                value={form.addressLine}
                onChange={(event) => set('addressLine', event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <IconText
                  icon="pin"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => set('city', event.target.value)}
                />
              </Field>
              <Field label="Postcode">
                <IconText
                  icon="hash"
                  autoComplete="postal-code"
                  value={form.postcode}
                  onChange={(event) => set('postcode', event.target.value)}
                />
              </Field>
            </div>
            <Field label="Country">
              <CountrySelect value={form.country} onChange={(value) => set('country', value)} />
            </Field>
            <UploadField
              label="Proof of address"
              hint="Utility bill or bank statement from the last 3 months (PDF or photo)."
              fileName={form.proofOfAddressFileName ?? ''}
              onFile={(file) => setForm((current) => ({ ...current, proofOfAddressFileName: file.name, proofOfAddressFile: file }))}
            />
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={goBack}>
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1">
            {step === 2 ? 'Submit for review' : 'Continue'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}

const fileClass =
  'block w-full text-sm text-revolut-ink/70 file:mr-4 file:rounded-full file:border-0 file:bg-revolut-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-revolut-ink'

function UploadField({
  label,
  hint,
  fileName,
  onFile,
}: {
  label: string
  hint: string
  fileName: string
  onFile: (file: StoredFile) => void
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="file"
        accept="image/*,.pdf"
        className={fileClass}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          readStoredFile(file).then(onFile).catch(() => onFile({ name: file.name, type: file.type, dataUrl: '' }))
        }}
      />
      {fileName ? <span className="mt-2 block text-xs text-revolut-ink/60">{fileName}</span> : null}
    </Field>
  )
}
