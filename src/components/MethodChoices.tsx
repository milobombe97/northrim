import { methodsForCountry } from '../data/payoutMethods'
import { MethodLogo } from './MethodLogo'

export function MethodChoices({
  country,
  value,
  onChange,
  basis = 'home',
}: {
  country: string
  value: string
  onChange: (id: string) => void
  basis?: 'home' | 'destination'
}) {
  const methods = methodsForCountry(country)
  return (
    <fieldset>
      <legend className="text-sm font-medium">Payment method</legend>
      <p className="mt-1 text-xs text-revolut-ink/50">
        {basis === 'destination' ? `Available in ${country}.` : `Based on where you live, ${country}.`}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {methods.map((item) => {
          const active = item.id === value
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm ${
                active ? 'border-revolut-ink bg-white' : 'border-revolut-line bg-white/70'
              }`}
            >
              <input
                type="radio"
                name={`method-${basis}-${country}`}
                className="sr-only"
                checked={active}
                onChange={() => onChange(item.id)}
              />
              <MethodLogo id={item.id} />
              <span>
                <span className="block font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-revolut-ink/55">{item.detail}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function methodLabel(country: string, id: string) {
  return methodsForCountry(country).find((item) => item.id === id)?.label ?? 'Bank transfer'
}

