import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BanknoteIcon, XIcon } from '@animateicons/react/lucide'
import type { ExchangeRate } from '../../types/exchangeRate.ts'
import { formatCurrency } from '../../utils/currency.ts'
import useDismiss from '../../hooks/useDismiss.ts'

interface ExchangeRateWidgetProps {
  data: ExchangeRate | null
  loading: boolean
  error: string | null
}

export function ExchangeRateWidget({ data, loading, error }: ExchangeRateWidgetProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [isOpen, setIsOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useDismiss({ ref: overlayRef, isOpen, onClose: () => setIsOpen(false) })

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const lastUpdated = data
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Costa_Rica',
      }).format(new Date(data.updatedAt || `${data.rateDate}T12:00:00`))
    : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-sm rounded-full border border-green-500 bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-green-500"
      >
        <BanknoteIcon size={20} aria-hidden="true" />
        <span>{t('moneda.sellRate')}</span>
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-100 grid place-items-center bg-scrim p-md animate-[modal-overlay-in_0.15s_ease-out]"
          onClick={(event) => {
            if (event.target === overlayRef.current) setIsOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-rate-title"
            className="relative w-[min(520px,94vw)] rounded-3xl border border-green-500 bg-white p-lg shadow-xl animate-[modal-in_0.2s_ease-out]"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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

            {loading ? (
              <p className="m-0 py-md font-body text-body text-neutral-500">{t('moneda.loading')}</p>
            ) : error ? (
              <p className="m-0 py-md font-body text-body text-danger">{t('moneda.error')}</p>
            ) : !data ? (
              <p className="m-0 py-md font-body text-body text-neutral-500">{t('moneda.unavailable')}</p>
            ) : (
              <>
                <div className="grid gap-sm sm:grid-cols-2">
                  {[
                    { symbol: '$', name: t('moneda.currency.USD'), sell: data.usdSell },
                    { symbol: '\u20ac', name: t('moneda.currency.EUR'), sell: data.eurSell },
                  ].map((row) => (
                    <div key={row.symbol} className="flex items-center justify-between gap-sm rounded-2xl border border-neutral-200 bg-transparent p-md">
                      <div className="flex items-center gap-sm">
                        <span className="flex size-12 items-center justify-center rounded-full bg-transparent font-heading text-2xl font-bold text-heading">
                          {row.symbol}
                        </span>
                        <span className="font-heading text-h6 font-bold text-heading">{row.name}</span>
                      </div>
                      <span className="font-heading text-h5 font-bold text-heading">
                        {'\u20a1'}{formatCurrency(row.sell, 'CRC', locale)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="m-0 mt-lg rounded-2xl bg-transparent p-md font-body text-sm leading-relaxed text-green-700">
                  {t('moneda.priceDisclaimer')}
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default ExchangeRateWidget
