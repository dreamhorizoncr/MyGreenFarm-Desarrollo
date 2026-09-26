import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import { useServicePlans } from '../hooks/useServicePlans.ts'
import { servicePlanService } from '../services/servicePlan.ts'
import { notify } from '../utils/notifications.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'

function PlanCard({ plan, onSubscribe, isLoading }: Readonly<{ plan: ServicePlan; onSubscribe: (plan: ServicePlan) => void; isLoading?: boolean }>) {
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
          {/* No tiene que ser ANY, cambiarlo luego */}
          {getPlanTypeLabel(plan.type, t as any)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-sm p-lg">
        <h3 className="m-0 font-heading text-h4 font-bold text-heading line-clamp-2">
          {plan.name}
        </h3>

        <p className="m-0 font-body text-body-sm text-body-text-dark line-clamp-2">
          {plan.description}
        </p>

        <div className="flex items-baseline justify-center gap-sm text-center">
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
            disabled={isLoading}
            className="w-full rounded-full bg-green-500 py-md font-body text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
          >
            {isLoading ? t('common.loading') : t('services.subscribe')}
          </button>
        </div>
      </div>
    </article>
  )
}

function ServicesPage() {
  const { t, i18n } = useTranslation()
  const { plans, loading, error, fetchPlans } = useServicePlans()
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
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-green-500 md:text-[46px]">
            {t('services.title')}
          </h1>
          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-green-500 md:text-[15px]">
            {t('services.description')}
          </p>
        </div>
      </section>

      <section className="relative w-full bg-bg-page py-[36px] md:py-[48px]">
        <Container className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
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
              isLoading={checkoutLoading === plan.id}
            />
          ))}
        </Container>
      </section>

    </div>
  )
}

export default ServicesPage
