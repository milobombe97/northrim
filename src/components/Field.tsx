import { createContext, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

const FieldId = createContext('')

export function useFieldId() {
  return useContext(FieldId)
}

const control =
  'w-full rounded-2xl border border-revolut-line bg-white px-4 py-3 text-sm text-revolut-ink outline-none transition placeholder:text-revolut-ink/35 focus:border-revolut-ink'

export const iconControl = `${control} pl-11`

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <FieldId.Provider value={id}>
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-revolut-ink">
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-revolut-ink/50">{hint}</span>
      ) : null}
    </div>
    </FieldId.Provider>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = useFieldId()
  return <input {...props} id={props.id ?? fieldId} className={`${control} ${props.className ?? ''}`} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = useFieldId()
  return (
    <span className="relative block">
      <select {...props} id={props.id ?? fieldId} className={`${control} appearance-none pr-10 ${props.className ?? ''}`} />
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-revolut-ink/45"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7.5 10 12.5 15 7.5" />
      </svg>
    </span>
  )
}
