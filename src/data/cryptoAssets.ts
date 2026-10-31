export const cryptoAssets = [
  { value: 'BTC', label: 'Bitcoin', hint: 'BTC · Layer 1' },
  { value: 'ETH', label: 'Ethereum', hint: 'ETH · Layer 1' },
  { value: 'USDT', label: 'Tether', hint: 'USDT · Stablecoin' },
  { value: 'SOL', label: 'Solana', hint: 'SOL · Layer 1' },
] as const

export type CryptoAssetId = (typeof cryptoAssets)[number]['value']

export function cryptoMark(symbol: CryptoAssetId) {
  const colors: Record<CryptoAssetId, string> = {
    BTC: 'bg-[#F7931A]',
    ETH: 'bg-[#627EEA]',
    USDT: 'bg-[#26A17B]',
    SOL: 'bg-[#9945FF]',
  }
  return colors[symbol]
}
