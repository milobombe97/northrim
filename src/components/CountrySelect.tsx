import { countries } from '../data/countries'
import { SelectMenu } from './SelectMenu'

export function CountrySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const names = (countries as readonly string[]).includes(value) ? countries : [value, ...countries]
  return (
    <SelectMenu
      searchable
      value={value}
      placeholder="Select a country"
      onChange={onChange}
      options={names.filter(Boolean).map((name) => ({ value: name, label: name }))}
    />
  )
}
