import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import { useServicePlans } from '../hooks/useServicePlans.ts'
import { useExchangeRate } from '../hooks/useExchangeRate.ts'
import { ExchangeRateWidget } from '../components/currency/ExchangeRateWidget.tsx'
import AnimatedNumber from '../components/ui/AnimatedNumber.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { servicePlanService } from '../services/servicePlan.ts'
import { notify } from '../utils/notifications.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import type { ExchangeRate, Currency } from '../types/exchangeRate.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'
import { convertCurrency, formatCurrency, currencySymbol } from '../utils/currency.ts'
import { CircleCheckIcon, ClockIcon } from '@animateicons/react/lucide'

function PlanCard({
  plan,
  onSubscribe,
  isLoading,
  exchangeRate,
  idioma,
}: Readonly<{
  plan: ServicePlan
  onSubscribe: (plan: ServicePlan) => void
  isLoading?: boolean
  exchangeRate: ExchangeRate | null
  idioma: string
}>) {
  const { t } = useTranslation()
  const [currency, setCurrency] = useState<Currency>('USD')
  const price = exchangeRate
    ? convertCurrency(plan.price, 'USD', currency, 'sell', exchangeRate)
    : plan.price

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition hover:-translate-y-1">
      <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
        {plan.imageUrl ? (
          <img
            src={plan.imageUrl}
            alt={plan.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-body text-body-sm text-neutral-400">{plan.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-sm px-lg pb-lg pt-md">
        <div className="flex items-start justify-between gap-sm">
          <h3 className="m-0 min-w-0 flex-1 text-left font-heading text-h4 font-bold text-green-500 line-clamp-2">
            {plan.name}
          </h3>

          <span className="w-fit shrink-0 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
            {getPlanTypeLabel(plan.type, t as any)}
          </span>
        </div>

        <p className="m-0 min-h-[48px] text-left font-body text-body-sm leading-relaxed text-body-text-dark line-clamp-2">
          {plan.description}
        </p>

        <div className="my-1 border-t border-neutral-500" />

        <div className="flex flex-col items-start gap-2xs">
          <div className="flex w-full flex-wrap justify-end gap-1" aria-label={t('moneda.convertTo')}>
            {(['USD', 'CRC', 'EUR'] as Currency[]).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setCurrency(option)}
                aria-pressed={currency === option}
                disabled={!exchangeRate && option !== 'USD'}
                className={`rounded-full border px-sm py-2xs font-body text-caption leading-tight transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  currency === option ? 'border-green-500 bg-green-500 text-white' : 'border-neutral-200 text-neutral-600 hover:border-green-500'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-left font-heading text-h2 font-bold text-green-500">
            <AnimatedNumber
              value={price}
              format={(n) => `${currencySymbol(currency)}${formatCurrency(n, currency, idioma)}`}
            />
          </span>
        </div>

        <div className="space-y-2xs pt-xs text-left">
          {plan.schedule && (
            <div className="font-body text-body-sm leading-relaxed text-neutral-500">
              <div className="flex items-center gap-2">
                <ClockIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                <span className="font-semibold text-neutral-600">{t('services.schedule')}</span>
              </div>
              <p className="m-0 mt-2xs px-1 py-2xs text-left text-body-sm">{plan.schedule}</p>
            </div>
          )}

          {plan.includes && (
            <div className="font-body text-body-sm leading-relaxed text-neutral-500">
              <div className="flex items-center gap-2">
                <CircleCheckIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                <span className="font-semibold text-neutral-600">{t('services.includes')}</span>
              </div>
              <p className="m-0 mt-2xs px-1 py-2xs text-left text-body-sm line-clamp-2">{plan.includes}</p>
            </div>
          )}
        </div>

        <div className="mt-auto pt-sm">
          <button
            type="button"
            onClick={() => onSubscribe(plan)}
            disabled={isLoading}
            className="h-11 w-full rounded-full bg-orange-500 font-body text-body-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {isLoading ? t('common.loading') : t('services.subscribe')}
          </button>
        </div>
      </div>
    </article>
  )
}

function PlanCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <Skeleton shape="rect" className="h-[200px] w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-sm p-lg">
        <Skeleton shape="line" className="h-5 w-3/4" />
        <Skeleton shape="line" className="h-4 w-full" />
        <Skeleton shape="line" className="h-4 w-2/3" />

        <div className="flex flex-col items-center gap-sm py-sm">
          <Skeleton shape="line" className="h-8 w-24" />
          <div className="flex gap-xs">
            <Skeleton shape="pill" className="h-6 w-12" />
            <Skeleton shape="pill" className="h-6 w-12" />
            <Skeleton shape="pill" className="h-6 w-12" />
          </div>
        </div>

        <Skeleton shape="line" className="h-3 w-3/5" />

        <div className="mt-auto pt-sm">
          <Skeleton shape="pill" className="h-11 w-full" />
        </div>
      </div>
    </article>
  )
}

function ServicesPage() {
  const { t, i18n } = useTranslation()
  const { plans, loading, error, fetchPlans } = useServicePlans()
  const { data: exchangeRate, loading: exchangeRateLoading, error: exchangeRateError, reload: reloadExchangeRate } = useExchangeRate()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    void fetchPlans(i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const handleSubscribe = async (plan: ServicePlan) => {
    setCheckoutLoading(plan.id)
    try {
      const url = await servicePlanService.checkoutPlan(plan.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setCheckoutLoading(null)
      notify.error({
        title: t('services.checkoutErrorToastTitle'),
        description: t('services.checkoutErrorToastDescription'),
      })
    }
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[220px] items-center bg-white px-[30px] py-[32px] text-center md:min-h-[250px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-green-500 md:text-h1">
            {t('services.title')}
          </h1>
          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">
            {t('services.description')}
          </p>
        </div>
      </section>

      <section className="relative w-full bg-bg-page py-[36px] md:py-[48px]">
        <Container className="!max-w-[1400px] mb-[36px] flex justify-start md:mb-[48px]">
          <ExchangeRateWidget
              data={exchangeRate}
              loading={exchangeRateLoading}
              error={exchangeRateError}
              onOpen={() => void reloadExchangeRate()}
          />
        </Container>

        <Container className="!max-w-[1400px] grid grid-cols-1 gap-[20px] md:grid-cols-3">
          {loading && (
            <>
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
            </>
          )}

          {error && (
            <p className="col-span-full p-xl text-center font-body text-body text-danger">
              {error}
            </p>
          )}

          {!loading && !error && plans.length === 0 && (
            <p className="col-span-full p-xl text-center font-body text-body text-neutral-500">
              {t('services.empty')}
            </p>
          )}

          {!loading && !error && plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
              isLoading={checkoutLoading === plan.id}
              exchangeRate={exchangeRate}
              idioma={i18n.language}
            />
          ))}
        </Container>
      </section>

    </div>
  )
}

export default ServicesPage
