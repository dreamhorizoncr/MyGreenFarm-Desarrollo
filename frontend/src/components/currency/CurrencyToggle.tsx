import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import TabHighlight from '../ui/TabHighlight.tsx'
import type { Currency } from '../../types/exchangeRate.ts'

const CURRENCIES: Currency[] = ['USD', 'CRC', 'EUR']

interface CurrencyToggleProps {
  value: Currency
  onChange: (currency: Currency) => void
  hasExchangeRate: boolean
}

function CurrencyToggle({ value, onChange, hasExchangeRate }: Readonly<CurrencyToggleProps>) {
  const { t } = useTranslation()
  const groupId = useId()

  return (
    <div className="isolate flex w-full flex-wrap justify-end gap-1" aria-label={t('moneda.convertTo')}>
      {CURRENCIES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          disabled={!hasExchangeRate && option !== 'USD'}
          className={`relative rounded-full border px-sm py-2xs font-body text-caption leading-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
            value === option
              ? 'border-green-500 text-white'
              : 'border-neutral-200 bg-transparent text-neutral-600 enabled:hover:border-green-500 enabled:hover:bg-green-50 enabled:hover:text-heading'
          }`}
        >
          {value === option && <TabHighlight layoutId={`currency-${groupId}`} className="bg-green-500" />}
          {option}
        </button>
      ))}
    </div>
  )
}

export default CurrencyToggle
