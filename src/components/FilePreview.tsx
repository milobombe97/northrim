import type { StoredFile } from '../data/files'

export function FilePreview({
  file,
  fallbackName,
  missing,
}: {
  file?: StoredFile
  fallbackName?: string
  missing?: string
}) {
  const name = file?.name || fallbackName
  if (!file?.dataUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-revolut-line bg-revolut-muted/50 px-4 py-8 text-sm text-revolut-ink/60">
        {name
          ? `${name} is listed, but the file was not saved. ${missing || 'Upload it again from the client dashboard.'}`
          : 'No file uploaded.'}
      </div>
    )
  }

  const image = file.type.startsWith('image/') || file.dataUrl.startsWith('data:image/')
  const pdf = file.type === 'application/pdf' || file.dataUrl.startsWith('data:application/pdf')

  return (
    <div className="overflow-hidden rounded-2xl border border-revolut-line bg-revolut-muted/40">
      {image ? (
        <img src={file.dataUrl} alt={file.name} className="max-h-[36rem] w-full object-contain bg-white" />
      ) : pdf ? (
        <iframe title={file.name} src={file.dataUrl} className="h-[36rem] w-full bg-white" />
      ) : (
        <p className="px-4 py-8 text-sm text-revolut-ink/60">This file type opens in a new tab.</p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-revolut-line bg-white px-4 py-3 text-sm">
        <span className="truncate text-revolut-ink/70">{file.name}</span>
        <a href={file.dataUrl} target="_blank" rel="noreferrer" className="shrink-0 font-medium hover:underline">
          Open file
        </a>
      </div>
    </div>
  )
}
