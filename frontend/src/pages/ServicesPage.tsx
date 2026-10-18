import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import { useServicePlans } from '../hooks/useServicePlans.ts'
import { useExchangeRate } from '../hooks/useExchangeRate.ts'
import { ExchangeRateWidget } from '../components/currency/ExchangeRateWidget.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useGridPageSize } from '../hooks/useGridPageSize.ts'
import AnimatedNumber from '../components/ui/AnimatedNumber.tsx'
import CurrencyToggle from '../components/currency/CurrencyToggle.tsx'
import type { Currency, ExchangeRate } from '../types/exchangeRate.ts'
import { convertCurrency, currencySymbol, formatCurrency } from '../utils/currency.ts'
import ServiceDetailModal from '../components/ServiceDetailModal.tsx'
import { servicePlanService } from '../services/servicePlan.ts'
import { notify, notifyError } from '../utils/notifications.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

const cleanCurrency = (value?: string): Currency => {
  const upper = value?.toUpperCase()
  return upper === 'USD' || upper === 'EUR' ? upper : 'CRC'
}

function PlanCard({
  plan,
  onSelect,
  exchangeRate,
  loading = false,
}: Readonly<{
  plan?: ServicePlan
  onSelect?: (currency: Currency) => void
  exchangeRate?: ExchangeRate | null
  loading?: boolean
}>) {
  const { t, i18n } = useTranslation()
  const [currency, setCurrency] = useState<Currency>(() => cleanCurrency(plan?.currency))

  const price = plan && exchangeRate
    ? convertCurrency(plan.price, cleanCurrency(plan.currency), currency, 'buy', exchangeRate)
    : plan?.price ?? 0

  if (loading) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <Skeleton shape="rect" className="h-[180px] w-full rounded-none" />

        <div className="flex flex-1 flex-col gap-sm p-lg">
          <Skeleton shape="line" className="h-5 w-3/4" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />

          <div className="flex flex-col gap-xs py-xs">
            <div className="flex gap-xs">
              <Skeleton shape="pill" className="h-6 w-12" />
              <Skeleton shape="pill" className="h-6 w-12" />
              <Skeleton shape="pill" className="h-6 w-12" />
            </div>
            <Skeleton shape="line" className="h-8 w-28" />
          </div>

          <div className="mt-auto pt-sm">
            <Skeleton shape="pill" className="h-11 w-full" />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white card-hover">
      <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
        {plan!.imageUrl ? (
          <img
            src={plan!.imageUrl}
            alt={plan!.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-body text-body-sm text-neutral-400">{plan!.name}</span>
          </div>
        )}
        <span className="absolute bottom-sm left-sm flex items-center gap-1 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white shadow">
          {getPlanTypeLabel(plan!.type, t as never)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-sm px-lg pb-lg pt-md">
        <div className="flex items-start justify-between gap-sm">
          <h3 className="m-0 min-w-0 flex-1 text-left font-heading text-h4 font-bold text-green-500 line-clamp-2">
            {plan!.name}
          </h3>

        </div>

        <p className="-mt-xs mb-0 min-h-[2lh] text-left font-body text-body-sm leading-relaxed text-body-text-dark line-clamp-2">
          {plan!.description}
        </p>

        <div className="mt-auto flex flex-col items-start gap-2xs pt-xs [&>div:first-child]:justify-start">
          <CurrencyToggle value={currency} onChange={setCurrency} hasExchangeRate={Boolean(exchangeRate)} />
          <span className="text-left font-heading text-h2 font-bold text-green-500">
            <AnimatedNumber
              value={price}
              format={(n) => `${currencySymbol(currency)}${formatCurrency(n, currency, i18n.language)}`}
            />
          </span>
        </div>

        <div className="pt-sm">
          <button
            type="button"
            onClick={() => onSelect?.(currency)}
            className="h-11 w-full rounded-full bg-orange-500 font-body text-body-sm font-semibold text-white transition hover:bg-orange-600"
          >
            {t('clubs.moreInfo')}
          </button>
        </div>
      </div>
    </article>
  )
}

function ServicesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { plans, loading, error, fetchPlans, totalPages } = useServicePlans()
  const [currentPage, setCurrentPage] = useState(1)
  // Múltiplo de las columnas visibles (1 / 3) para no dejar huecos en la última fila
  const pageSize = useGridPageSize({ base: 1, md: 3 })
  const [lastPageSize, setLastPageSize] = useState(pageSize)
  if (lastPageSize !== pageSize) {
    setLastPageSize(pageSize)
    setCurrentPage(1)
  }

  const { data: exchangeRate, loading: exchangeRateLoading, error: exchangeRateError, reload: reloadExchangeRate } = useExchangeRate()
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<{ plan: ServicePlan; currency: Currency } | null>(null)
  const checkoutWindowRef = useRef<Window | null>(null)

  useEffect(() => {
    void fetchPlans(currentPage - 1, i18n.language, pageSize)
  }, [currentPage, i18n.language, pageSize])

  useEffect(() => {
    const handlePaymentReturn = (event: MessageEvent<{ type?: string }>) => {
      if (event.origin !== window.location.origin || event.source !== checkoutWindowRef.current) return

      if (event.data?.type === 'payment-success') {
        navigate('/payment-success')
      } else if (event.data?.type === 'payment-failed') {
        navigate('/payment-failed')
      } else {
        return
      }

      checkoutWindowRef.current = null
    }

    const paymentChannel = new BroadcastChannel('payment_channel')
    paymentChannel.onmessage = (event: MessageEvent<string>) => {
      if (event.data === 'PAYMENT_SUCCESS') {
        navigate('/payment-success')
      } else if (event.data === 'PAYMENT_FAILED') {
        navigate('/payment-failed')
      }
    }

    window.addEventListener('message', handlePaymentReturn)
    return () => {
      window.removeEventListener('message', handlePaymentReturn)
      paymentChannel.close()
    }
  }, [navigate])

  const handleSubscribe = async (plan: ServicePlan) => {
    const checkoutWindow = window.open('', '_blank')

    if (!checkoutWindow) {
      notify.error({
        title: t('services.checkoutErrorToastTitle'),
        description: t('services.popupBlocked'),
      })
      return
    }

    checkoutWindowRef.current = checkoutWindow

    const doc = checkoutWindow.document;
    doc.title = t('services.connectingPayment');
    doc.body.style.cssText = `
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f6f8f5;
      color: #263b2f;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    doc.body.innerHTML = `
      <style>
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #d8e2dc;
          border-top-color: #3b5d50;
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
        }
        .text {
          font-size: 16px;
          font-weight: 500;
          letter-spacing: -0.01em;
          animation: pulse-soft 2s ease-in-out infinite;
        }
      </style>
      <div class="loader-container">
        <div class="spinner"></div>
        <p class="text">Preparando pago seguro...</p>
      </div>
    `;

    setCheckoutLoading(plan.id)

    try {
      const checkout = await servicePlanService.checkoutPlan(plan.id)

      checkoutWindow.location.replace(checkout.url)

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await servicePlanService.checkPaymentStatus(checkout.gatewaySessionId)
          if (statusResponse.isPaid) {
            clearInterval(pollInterval)
            clearInterval(closeCheckInterval)
            setCheckoutLoading(null)
            navigate('/payment-success')
          } else if (statusResponse.isFailed) {
            clearInterval(pollInterval)
            clearInterval(closeCheckInterval)
            setCheckoutLoading(null)
            navigate('/payment-failed')
          }
        } catch (err) {
          console.error("Error consultando el estado del pago", err)
        }
      }, 3000)

      const closeCheckInterval = setInterval(() => {
        if (checkoutWindow.closed) {
          clearInterval(closeCheckInterval)
          clearInterval(pollInterval)
          setCheckoutLoading(null)
        }
      }, 1500)

    } catch (error) {
      console.error('Error creando la sesión de pago', error)
      checkoutWindow.close()
      setCheckoutLoading(null)
      notifyError(t('services.checkoutErrorToastTitle'), error)
    }
  }

  const skeletonCount = useSkeletonCount('services', loading, plans.length, 3)

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-start bg-white px-[30px] pt-[48px] pb-[40px] text-center md:min-h-[320px] md:pt-[72px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-green-500">
            {t('services.title')}
          </h1>
          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">
            {t('services.description')}
          </p>
        </div>
      </section>

      <section className="relative w-full bg-bg-page py-10 md:py-12">
        <Container className="mb-[36px] flex justify-start md:mb-[48px]">
          <ExchangeRateWidget
            data={exchangeRate}
            loading={exchangeRateLoading}
            error={exchangeRateError}
            onOpen={() => void reloadExchangeRate()}
          />
        </Container>

        <Container className="flex flex-col gap-[36px]">
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
            {loading && (
              <SkeletonList count={skeletonCount}>{() => <PlanCard loading />}</SkeletonList>
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
                onSelect={(currency) => setSelectedPlan({ plan, currency })}
                exchangeRate={exchangeRate}
              />
            ))}
          </div>

          {!loading && !error && plans.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Container>
      </section>

      {selectedPlan && (
        <ServiceDetailModal
          plan={selectedPlan.plan}
          initialCurrency={selectedPlan.currency}
          exchangeRate={exchangeRate}
          isLoading={checkoutLoading === selectedPlan.plan.id}
          onSubscribe={handleSubscribe}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  )
}

export default ServicesPage