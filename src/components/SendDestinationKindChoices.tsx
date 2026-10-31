export type SendDestinationKind = 'nevolute' | 'external'

export function isLikelyEmail(value: string) {
  const trimmed = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

type Props = {
  value: SendDestinationKind
  onChange: (value: SendDestinationKind) => void
}

export function SendDestinationKindChoices({ value, onChange }: Props) {
  const options: { id: SendDestinationKind; title: string; detail: string }[] = [
    {
      id: 'nevolute',
      title: 'Another North Rim customer',
      detail: 'Send by their account email only.',
    },
    {
      id: 'external',
      title: 'Bank or other method',
      detail: 'Pay someone Outside North Rim with full payment details.',
    },
  ]

  return (
    <fieldset>
      <legend className="text-sm font-medium">Who are you paying?</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((item) => {
          const active = item.id === value
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 text-sm ${
                active ? 'border-revolut-ink bg-white' : 'border-revolut-line bg-white/70'
              }`}
            >
              <input
                type="radio"
                name="send-destination-kind"
                className="sr-only"
                checked={active}
                onChange={() => onChange(item.id)}
              />
              <span className="font-medium">{item.title}</span>
              <span className="mt-1 text-xs text-revolut-ink/55">{item.detail}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
