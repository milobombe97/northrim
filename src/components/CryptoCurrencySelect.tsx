import { Field } from './Field'
import { SelectMenu } from './SelectMenu'
import { cryptoAssets, cryptoMark, type CryptoAssetId } from '../data/cryptoAssets'

export function CryptoCurrencySelect({
  value,
  onChange,
  hint = 'Choose the asset for this payment.',
}: {
  value: CryptoAssetId
  onChange: (value: CryptoAssetId) => void
  hint?: string
}) {
  return (
    <Field label="Cryptocurrency" hint={hint}>
      <SelectMenu
        value={value}
        onChange={(next) => onChange(next as CryptoAssetId)}
        searchable
        placeholder="Select cryptocurrency"
        options={cryptoAssets.map((item) => ({
          value: item.value,
          label: item.label,
          hint: item.hint,
          icon: <CoinMark symbol={item.value} />,
        }))}
      />
    </Field>
  )
}

function CoinMark({ symbol }: { symbol: CryptoAssetId }) {
  return (
    <span
      className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white ${cryptoMark(symbol)}`}
    >
      {symbol.slice(0, 1)}
    </span>
  )
}

export function paymentMethodLabel(
  country: string,
  method: string,
  methodLabelFn: (country: string, method: string) => string,
  coin?: CryptoAssetId,
) {
  const base = methodLabelFn(country, method)
  return method === 'crypto' && coin ? `${base} · ${coin}` : base
}
