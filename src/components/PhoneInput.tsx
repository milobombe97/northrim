import { useEffect, useId, useRef, useState } from 'react'
import { dialCodes, joinPhone, splitPhone } from '../data/dialCodes'
import { useFieldId } from './Field'
import { FieldIcon } from './PasswordInput'

export function PhoneInput({
  value,
  onChange,
  placeholder = '7700 900123',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const fieldId = useFieldId()
  const parsed = splitPhone(value)
  const [iso, setIso] = useState(parsed.iso)
  const [national, setNational] = useState(parsed.national)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = dialCodes.find((item) => item.iso === iso) ?? dialCodes.find((item) => item.iso === 'GB')!
  const visible = dialCodes.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return item.name.toLowerCase().includes(q) || item.dial.includes(q.replace('+', '')) || item.iso.toLowerCase().includes(q)
  })

  useEffect(() => {
    const next = splitPhone(value)
    setIso(next.iso)
    setNational(next.national)
  }, [value])

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

  function choose(nextIso: string) {
    setIso(nextIso)
    setOpen(false)
    setQuery('')
    onChange(joinPhone(nextIso, national))
  }

  return (
    <div ref={rootRef} className="relative flex gap-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-revolut-line bg-white px-3 py-3 text-sm text-revolut-ink outline-none focus:border-revolut-ink"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden className="inline-flex items-center gap-1.5">
          <DialFlag iso={selected.iso} />
          <span>+{selected.dial}</span>
        </span>
        <svg viewBox="0 0 20 20" aria-hidden className={`size-4 text-revolut-ink/45 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </button>
      <span className="relative block min-w-0 flex-1">
      <FieldIcon name="phone" />
      <input
        id={fieldId || undefined}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder={placeholder}
        value={national}
        className="w-full rounded-2xl border border-revolut-line bg-white py-3 pr-4 pl-11 text-sm text-revolut-ink outline-none placeholder:text-revolut-ink/35 focus:border-revolut-ink"
        onChange={(event) => {
          const next = event.target.value
          setNational(next)
          onChange(joinPhone(iso, next))
        }}
      />
      </span>
      {open ? (
        <div className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-revolut-line bg-white shadow-[0_12px_40px_rgba(25,28,31,0.12)]">
          <div className="border-b border-revolut-line p-2">
            <span className="relative block">
              <FieldIcon name="search" />
              <input
                autoFocus
                value={query}
                placeholder="Search country or code"
                className="w-full rounded-xl bg-revolut-muted py-2 pr-3 pl-11 text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
              />
            </span>
          </div>
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {visible.length === 0 ? <li className="px-3 py-3 text-sm text-revolut-ink/50">No matches.</li> : null}
            {visible.map((item) => {
              const active = item.iso === iso
              return (
                <li key={item.iso} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                      active ? 'bg-revolut-ink text-white' : 'hover:bg-revolut-muted'
                    }`}
                    onClick={() => choose(item.iso)}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className={`inline-flex items-center gap-1.5 ${active ? 'text-white/70' : 'text-revolut-ink/50'}`}>
                      <DialFlag iso={item.iso} />
                      +{item.dial}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function DialFlag({ iso }: { iso: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt=""
      width={20}
      height={14}
      className="h-3.5 w-5 rounded-[3px] object-cover"
    />
  )
}
