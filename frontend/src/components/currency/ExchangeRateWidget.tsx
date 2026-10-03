import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BanknoteIcon, XIcon } from '@animateicons/react/lucide'
import type { ExchangeRate } from '../../types/exchangeRate.ts'
import { formatCurrency } from '../../utils/currency.ts'

interface ExchangeRateWidgetProps {
  data: ExchangeRate | null
  loading: boolean
  error: string | null
  onOpen: () => void
}

export function ExchangeRateWidget({ data, loading, error, onOpen }: Readonly<ExchangeRateWidgetProps>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const handleClose = () => setIsOpen(false)

  const lastUpdated = data
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Costa_Rica',
      }).format(new Date(data.updatedAt || `${data.rateDate}T12:00:00`))
    : null

  function renderStatus() {
    if (loading) return <p className="m-0 py-md font-body text-body text-neutral-500">{t('moneda.loading')}</p>
    if (error) return <p className="m-0 py-md font-body text-body text-danger">{t('moneda.error')}</p>
    if (!data) return <p className="m-0 py-md font-body text-body text-neutral-500">{t('moneda.unavailable')}</p>

    return (
      <>
        <div className="grid gap-sm sm:grid-cols-2">
          {[
            { symbol: '$', name: t('moneda.currency.USD'), sell: data.usdSell },
            { symbol: '€', name: t('moneda.currency.EUR'), sell: data.eurSell },
          ].map((row) => (
            <div key={row.symbol} className="flex min-w-0 items-center justify-between gap-xs rounded-2xl border border-neutral-200 bg-transparent px-sm py-md">
              <div className="flex min-w-0 flex-1 items-center gap-xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent font-heading text-2xl font-bold text-heading">
                  {row.symbol}
                </span>
                <span className="min-w-0 font-heading text-body-sm font-bold text-heading">{row.name}</span>
              </div>
              <span className="shrink-0 whitespace-nowrap font-heading text-h6 font-bold text-heading">
                {'₡'}{formatCurrency(row.sell, 'CRC', locale)}
              </span>
            </div>
          ))}
        </div>
        <p className="m-0 mt-lg rounded-2xl bg-transparent p-md font-body text-body-sm leading-relaxed text-green-700">
          {t('moneda.priceDisclaimer')}
        </p>
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true)
          onOpen()
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-sm rounded-full border border-green-500 bg-green-500 px-lg py-sm font-body text-body-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-green-500"
      >
        <BanknoteIcon size={20} aria-hidden="true" />
        <span>{t('moneda.sellRate')}</span>
      </button>

      {isOpen && (
        <dialog
          ref={(el) => {
            dialogRef.current = el
            if (el && !el.open) el.showModal()
          }}
          onClose={handleClose}
          onClick={(event) => {
            if (event.target === dialogRef.current) handleClose()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') handleClose()
          }}
          aria-labelledby="exchange-rate-title"
          className="m-auto w-[min(520px,94vw)] max-w-none rounded-3xl border border-neutral-200 bg-white p-lg shadow-xl backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('legalModal.close')}
            className="absolute right-md top-md inline-flex size-10 items-center justify-center rounded-full bg-transparent text-green-700 transition hover:bg-transparent hover:opacity-70 focus-visible:outline-2 focus-visible:outline-green-500"
          >
            <XIcon size={20} />
          </button>

          <div className="mb-lg text-center">
            <h2 id="exchange-rate-title" className="m-0 font-heading text-h4 font-bold text-green-500">
              {t('moneda.sellRate')}
            </h2>
            {data && lastUpdated && (
              <p className="m-0 mt-xs font-body text-body-sm text-neutral-500">
                {t('moneda.sourceAndDate', { source: data.source, rateDate: lastUpdated })}
              </p>
            )}
          </div>

          {renderStatus()}
        </dialog>
      )}
    </>
  )
}

export default ExchangeRateWidget
