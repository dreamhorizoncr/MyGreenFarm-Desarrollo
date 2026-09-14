import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import { useServicePlans } from '../hooks/useServicePlans.ts'
import { servicePlanService } from '../services/servicePlan.ts'
import type { ServicePlan } from '../types/servicePlan.ts'

const PLAN_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'services.oneTime',
  MONTHLY: 'services.monthly',
  ANNUALLY: 'services.annual',
}

const INTERVAL_UNITS: Record<string, string> = {
  MONTHS: 'services.months',
  YEARS: 'services.years',
  WEEKS: 'services.weeks',
  DAYS: 'services.days',
}

function getPlanTypeLabel(type: string, t: (key: string) => string): string {
  const exact = PLAN_TYPE_LABELS[type]
  if (exact) return t(exact)

  const match = type.match(/^(\d+)_(.+)$/)
  if (match) {
    const count = match[1]
    const unitKey = INTERVAL_UNITS[match[2]]
    if (unitKey) return `${count} ${t(unitKey)}`
  }

  return type
}

function PlanCard({ plan, onSubscribe }: { plan: ServicePlan; onSubscribe: (plan: ServicePlan) => void }) {
  const { t } = useTranslation()

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-[200px] w-full overflow-hidden bg-neutral-100">
        {plan.imageUrl ? (
          <img
            src={plan.imageUrl}
            alt={plan.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-body text-sm text-neutral-400">{plan.name}</span>
          </div>
        )}
        <span className="absolute bottom-sm left-sm rounded-full bg-[var(--orange-500)] px-md py-xs font-body text-body-sm font-bold text-white shadow">
          {getPlanTypeLabel(plan.type, t)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-sm p-lg">
        <h3 className="m-0 font-heading text-h4 font-bold text-heading line-clamp-2">
          {plan.name}
        </h3>

        <p className="m-0 font-body text-body-sm text-body-text-dark line-clamp-2">
          {plan.description}
        </p>

        <div className="flex items-baseline gap-sm">
          <span className="font-heading text-h3 font-bold text-green-500">
            {plan.price}
          </span>
        </div>

        {plan.schedule && (
          <p className="m-0 font-body text-xs text-neutral-500">
            <span className="font-semibold">{t('services.schedule')}:</span> {plan.schedule}
          </p>
        )}

        {plan.includes && (
          <p className="m-0 font-body text-xs leading-relaxed text-neutral-500 line-clamp-3">
            <span className="font-semibold">{t('services.includes')}:</span> {plan.includes}
          </p>
        )}

        <div className="mt-auto pt-sm">
          <button
            type="button"
            onClick={() => onSubscribe(plan)}
            className="w-full rounded-full bg-green-500 py-md font-body text-sm font-semibold text-white transition hover:bg-green-600"
          >
            {t('services.subscribe')}
          </button>
        </div>
      </div>
    </article>
  )
}

function ServicesPage() {
  const { t } = useTranslation()
  const { plans, loading, error, fetchPlans } = useServicePlans()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    void fetchPlans()
  }, [fetchPlans])

  const handleSubscribe = async (plan: ServicePlan) => {
    setCheckoutLoading(plan.id)
    try {
      const url = await servicePlanService.createCheckoutSession(plan.stripePriceId)
      window.location.href = url
    } catch {
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[360px] items-center bg-white px-[30px] py-[60px] text-center md:min-h-[420px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-green-500 md:text-[46px]">
            {t('services.title')}
          </h1>
          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-green-500 md:text-[15px]">
            {t('services.description')}
          </p>
        </div>
      </section>

      <section className="relative w-full bg-bg-page">
        <Container className="grid auto-rows-fr grid-cols-1 gap-xl pb-1500 pt-1000 md:grid-cols-3">
          {loading && (
            <p className="col-span-full p-xl text-center font-body text-base text-neutral-500">
              {t('common.loading')}
            </p>
          )}

          {error && (
            <p className="col-span-full p-xl text-center font-body text-base text-danger">
              {error}
            </p>
          )}

          {!loading && !error && plans.length === 0 && (
            <p className="col-span-full p-xl text-center font-body text-base text-neutral-500">
              {t('services.empty')}
            </p>
          )}

          {!loading && !error && plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </Container>
      </section>

      {/* Spacer blanco */}
      <section aria-hidden="true" className="min-h-[200px] w-full bg-white" />
    </div>
  )
}

export default ServicesPage
