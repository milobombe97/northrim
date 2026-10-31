import { brand } from '../config/brand'

type Props = {
  className?: string
  /** Show “Inc” on a second line on small screens when compact */
  compact?: boolean
}

/** Visible site name — always “North Rim Inc”. */
export function BrandWordmark({ className = '', compact = false }: Props) {
  if (compact) {
    return (
      <span className={`font-semibold tracking-[-0.03em] ${className}`}>
        {brand.wordmark}
      </span>
    )
  }
  return (
    <span className={`font-semibold tracking-[-0.03em] ${className}`} aria-label={brand.wordmark}>
      {brand.wordmark}
    </span>
  )
}
