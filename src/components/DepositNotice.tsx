import { useState } from 'react'
import { supportEmail } from '../data/banking'
import { readStoredFile, type StoredFile } from '../data/files'

export function DepositNotice({
  method,
  email,
  receiptName,
  file,
  stored = false,
  sent,
  outcome = 'pending',
  onUpload,
  onSend,
  onDismiss,
}: {
  method: string
  email: string
  receiptName?: string
  file?: StoredFile
  stored?: boolean
  sent?: boolean
  outcome?: 'pending' | 'approved' | 'declined'
  onUpload: (file: StoredFile) => Promise<{ error?: string } | { ok?: true } | void> | { error?: string } | { ok?: true } | void
  onSend: () => void
  onDismiss?: () => void
}) {
  const [error, setError] = useState('')
  const missingFile = Boolean(receiptName) && !stored

  async function choose(file?: File) {
    if (!file) return
    setError('')
    try {
      const result = await onUpload(await readStoredFile(file))
      if (result && 'error' in result && result.error) {
        setError(result.error)
      }
    } catch {
      setError('That file could not be saved. Use a photo or a PDF and try again.')
    }
  }

  return (
    <div className="rounded-2xl border border-revolut-line bg-white p-4 shadow-[0_16px_40px_rgba(25,28,31,0.18)]">
      <p className="text-sm font-medium">Payment details</p>
      <p className="mt-2 text-sm leading-relaxed text-revolut-ink/75">
        Our support team will send our details for {method} to your email <span className="font-medium text-revolut-ink">{email}</span>.
      </p>
      {file?.dataUrl ? <ReceiptImage file={file} /> : null}
      {outcome === 'approved' ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-emerald-700" role="status">Payment successful</p>
          <p className="mt-1 text-sm leading-relaxed text-revolut-ink/75">The funds are now in the account.</p>
          <button type="button" className="mt-3 text-sm font-medium underline-offset-4 hover:underline" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      ) : outcome === 'declined' ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-red-700" role="status">Payment declined</p>
          <p className="mt-1 text-sm leading-relaxed text-revolut-ink/75">
            This payment was rejected. Contact the support team at{' '}
            <a href={`mailto:${supportEmail}`} className="font-medium text-revolut-ink underline-offset-4 hover:underline">{supportEmail}</a>.
          </p>
        </div>
      ) : sent && !missingFile ? (
        <p className="mt-3 text-sm leading-relaxed text-revolut-ink/75" role="status">
          Receipt has been sent and is pending review and approval. Once approved, the funds will reflect in your account. This can take between 1 and 24 hours.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-revolut-ink/75">
            If you have already made your deposit, upload the receipt here.
          </p>
          {receiptName && !missingFile ? (
            <button
              type="button"
              className="mt-3 inline-flex rounded-full bg-revolut-ink px-4 py-2 text-sm font-medium text-white"
              onClick={onSend}
            >
              Send
            </button>
          ) : (
            <label className="mt-3 inline-flex cursor-pointer rounded-full bg-revolut-ink px-4 py-2 text-sm font-medium text-white">
              {missingFile ? 'Upload receipt again' : 'Upload receipt'}
              <input
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  void choose(file)
                }}
              />
            </label>
          )}
          {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
          <p className="mt-3 text-xs leading-relaxed text-revolut-ink/55">
            {missingFile
              ? `${receiptName} was not saved. Upload it again so support can open the file.`
              : receiptName
                ? `${receiptName} is attached. Send it for review. The balance is not updated yet.`
                : 'Without a receipt this stays pending. The balance is not updated until support approves the receipt.'}
          </p>
        </>
      )}
    </div>
  )
}

function ReceiptImage({ file }: { file: StoredFile }) {
  const image = file.type.startsWith('image/') || file.dataUrl.startsWith('data:image/')
  const pdf = file.type === 'application/pdf' || file.dataUrl.startsWith('data:application/pdf')
  if (image) {
    return <img src={file.dataUrl} alt={file.name} className="mt-3 max-h-40 w-full rounded-xl bg-revolut-muted object-contain" />
  }
  if (pdf) {
    return <iframe title={file.name} src={file.dataUrl} className="mt-3 h-40 w-full rounded-xl bg-white" />
  }
  return (
    <a href={file.dataUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium hover:underline">
      Open {file.name}
    </a>
  )
}
