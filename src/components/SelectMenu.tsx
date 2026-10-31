import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useFieldId } from './Field'
import { FieldIcon } from './PasswordInput'

export type MenuOption = {
  value: string
  label: string
  hint?: string
  icon?: ReactNode
}

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Choose',
  searchable = false,
}: {
  value: string
  onChange: (value: string) => void
  options: MenuOption[]
  placeholder?: string
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldId = useFieldId()
  const listId = useId()
  const selected = options.find((option) => option.value === value)
  const visible = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(next: string) {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={fieldId || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-2 rounded-2xl border border-revolut-line bg-white px-4 py-3 text-left text-sm text-revolut-ink outline-none transition focus:border-revolut-ink"
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.icon}
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-revolut-line bg-white shadow-[0_12px_40px_rgba(25,28,31,0.12)]">
          {searchable && (
            <div className="border-b border-revolut-line p-2">
              <span className="relative block">
                <FieldIcon name="search" />
                <input
                  autoFocus
                  value={query}
                  placeholder="Search"
                  className="w-full rounded-xl bg-revolut-muted py-2 pr-3 pl-11 text-sm outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
            </div>
          )}
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {visible.length === 0 && <li className="px-3 py-3 text-sm text-revolut-ink/50">No matches.</li>}
            {visible.map((option) => {
              const active = option.value === value
              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                      active ? 'bg-revolut-ink text-white' : 'hover:bg-revolut-muted'
                    }`}
                    onClick={() => choose(option.value)}
                  >
                    {option.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.hint && (
                        <span className={`block truncate text-xs ${active ? 'text-white/70' : 'text-revolut-ink/50'}`}>
                          {option.hint}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={`size-4 shrink-0 text-revolut-ink/45 transition ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  )
}
