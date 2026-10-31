import { useState, type InputHTMLAttributes } from 'react'
import { iconControl, useFieldId } from './Field'

const field =
  'w-full rounded-2xl border border-revolut-line bg-white py-3 pr-12 pl-11 text-sm text-revolut-ink outline-none transition focus:border-revolut-ink'

const checks = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Upper and lower case', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'A number', test: (value: string) => /\d/.test(value) },
  { label: 'A symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

const labels = ['Password strength', 'Weak', 'Fair', 'Good', 'Strong'] as const

export function PasswordInput({
  value,
  showGuide = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { showGuide?: boolean }) {
  const fieldId = useFieldId()
  const [visible, setVisible] = useState(false)
  const text = typeof value === 'string' ? value : ''
  const passed = checks.filter((item) => item.test(text)).length
  const score = text.length === 0 ? 0 : passed

  return (
    <span className="block">
      <span className="relative block">
        <FieldIcon name="lock" />
        <input
          {...props}
          id={props.id ?? fieldId}
          value={value}
          type={visible ? 'text' : 'password'}
          className={`${field} ${props.className ?? ''}`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-revolut-ink/55 hover:bg-revolut-muted hover:text-revolut-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setVisible((current) => !current)
          }}
        >
          <EyeIcon hidden={visible} />
        </button>
      </span>
      {showGuide ? <PasswordGuide score={score} text={text} /> : null}
    </span>
  )
}

function PasswordGuide({ score, text }: { score: number; text: string }) {
  return (
    <span className="mt-3 block">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${index < score ? barColor(score) : 'bg-revolut-line'}`}
          />
        ))}
      </span>
      <span className="mt-2 block text-xs font-medium text-revolut-ink/70">{labels[score]}</span>
      <span className="mt-2 grid gap-1">
        {checks.map((item) => {
          const ok = text.length > 0 && item.test(text)
          return (
            <span key={item.label} className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-700' : 'text-revolut-ink/50'}`}>
              <span aria-hidden className="grid size-3.5 place-items-center">
                {ok ? '✓' : '·'}
              </span>
              {item.label}
            </span>
          )
        })}
      </span>
    </span>
  )
}

function barColor(score: number) {
  if (score <= 1) return 'bg-red-500'
  if (score === 2) return 'bg-amber-500'
  if (score === 3) return 'bg-lime-500'
  return 'bg-emerald-600'
}

export type FieldIconName =
  | 'user'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'search'
  | 'pin'
  | 'home'
  | 'hash'
  | 'calendar'
  | 'card'
  | 'bell'
  | 'banknote'
  | 'shield'
  | 'logout'
  | 'withdraw'

export function IconText({
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: FieldIconName }) {
  const fieldId = useFieldId()
  return (
    <span className="relative block">
      <FieldIcon name={icon} />
      <input {...props} id={props.id ?? fieldId} className={`${iconControl} ${props.className ?? ''}`} />
    </span>
  )
}

export function Glyph({ name, className = 'size-4' }: { name: FieldIconName; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'user' && (
        <>
          <circle cx="10" cy="7" r="2.4" />
          <path d="M4.8 16c.7-2.3 2.6-3.5 5.2-3.5s4.5 1.2 5.2 3.5" />
        </>
      )}
      {name === 'mail' && (
        <>
          <rect x="3" y="4.5" width="14" height="11" rx="1.6" />
          <path d="m4 6.5 6 4.5 6-4.5" />
        </>
      )}
      {name === 'phone' && (
        <path d="M7 3.8h2.2l.8 2.4-1.5 1a8.5 8.5 0 0 0 3.3 3.3l1-1.5 2.4.8V12a1.2 1.2 0 0 1-1.3 1.2A11.2 11.2 0 0 1 5.8 5.1 1.2 1.2 0 0 1 7 3.8Z" />
      )}
      {name === 'lock' && (
        <>
          <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
          <path d="M7 8.5V6.4a3 3 0 0 1 6 0v2.1" />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="9" cy="9" r="4.25" />
          <path d="m12.2 12.2 3.3 3.3" />
        </>
      )}
      {name === 'pin' && (
        <>
          <path d="M10 17.2s5-4.1 5-8.1a5 5 0 1 0-10 0c0 4 5 8.1 5 8.1Z" />
          <circle cx="10" cy="9" r="1.6" />
        </>
      )}
      {name === 'home' && (
        <>
          <path d="M3.8 8.8 10 3.8l6.2 5" />
          <path d="M5.5 8.4V16h9V8.4" />
        </>
      )}
      {name === 'hash' && (
        <>
          <path d="M7.2 4.5 5.8 15.5M14.2 4.5 12.8 15.5M4.5 8h11M4 12.5h11" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x="3.5" y="4.5" width="13" height="12" rx="1.6" />
          <path d="M3.5 8.5h13M7 3.5v2.5M13 3.5v2.5" />
        </>
      )}
      {name === 'card' && (
        <>
          <rect x="3" y="5" width="14" height="10" rx="1.6" />
          <path d="M3 8.5h14" />
        </>
      )}
      {name === 'bell' && (
        <>
          <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 3.2.8 4.6 1.3 5.2H4.2c.5-.6 1.3-2 1.3-5.2Z" />
          <path d="M8.2 15.2a1.8 1.8 0 0 0 3.6 0" />
        </>
      )}
      {name === 'banknote' && (
        <>
          <rect x="3" y="5" width="14" height="10" rx="1.6" />
          <circle cx="10" cy="10" r="2" />
        </>
      )}
      {name === 'shield' && (
        <path d="M10 3.5 15.5 5.5v4.4c0 3.2-2.2 5.4-5.5 6.6-3.3-1.2-5.5-3.4-5.5-6.6V5.5L10 3.5Z" />
      )}
      {name === 'logout' && (
        <>
          <path d="M8 4.5H5.2A1.2 1.2 0 0 0 4 5.7v8.6a1.2 1.2 0 0 0 1.2 1.2H8" />
          <path d="M10.5 10H16M13.5 7.2 16.3 10 13.5 12.8" />
        </>
      )}
      {name === 'withdraw' && (
        <>
          <path d="M10 3.5v7.5" />
          <path d="M7 6.5 10 3.5l3 3" />
          <path d="M4.5 11.5h11v4.5h-11z" />
        </>
      )}
    </svg>
  )
}

export function FieldIcon({ name }: { name: FieldIconName }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-revolut-ink/45">
      <Glyph name={name} />
    </span>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {hidden ? (
        <>
          <path d="M3.5 3.5 16.5 16.5" />
          <path d="M8.2 8.4A2.2 2.2 0 0 0 11.6 12" />
          <path d="M6.2 6.4C4.6 7.4 3.4 8.8 2.8 10c1.4 2.8 4.1 4.6 7.2 4.6 1.1 0 2.2-.2 3.1-.7" />
          <path d="M9 5.5c.3 0 .7 0 1 .1 3 .3 5.5 2.1 7.2 4.4-.5.9-1.1 1.7-1.8 2.4" />
        </>
      ) : (
        <>
          <path d="M2.5 10S5.2 5.2 10 5.2 17.5 10 17.5 10 14.8 14.8 10 14.8 2.5 10 2.5 10Z" />
          <circle cx="10" cy="10" r="2.1" />
        </>
      )}
    </svg>
  )
}
