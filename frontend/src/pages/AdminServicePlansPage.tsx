import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheckIcon, ClockIcon, PlusIcon, Trash2Icon, PencilIcon, XIcon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import Button from '../components/ui/Button.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import CreateServicePlanModal from '../components/CreateServicePlanModal.tsx'
import { useServicePlanAdmin } from '../hooks/useServicePlanAdmin.ts'
import { notify } from '../utils/notifications.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'
import { useExchangeRate } from '../hooks/useExchangeRate.ts'
import type { Currency, ExchangeRate } from '../types/exchangeRate.ts'
import { convertCurrency, currencySymbol, formatCurrency } from '../utils/currency.ts'
import AnimatedNumber from '../components/ui/AnimatedNumber.tsx'

interface AdminPlanCardProps {
  plan: ServicePlan
  exchangeRate: ExchangeRate | null
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}

function AdminPlanCard({ 
  plan, 
  exchangeRate, 
  deleting, 
  onEdit, 
  onDelete, 
  language 
}: Readonly<{
  plan: ServicePlan
  exchangeRate: ExchangeRate | null
  deleting?: boolean
  onEdit: () => void
  onDelete: () => void
  language: string
}>) {
  const { t } = useTranslation()

  // 1. Obtener y limpiar la moneda base del plan de forma segura
  const getCleanCurrency = (curr?: string): Currency => {
    const upper = curr?.toUpperCase()
    return ['CRC', 'USD', 'EUR'].includes(upper ?? '') ? (upper as Currency) : 'CRC'
  }

  // 2. Estado local inicial sincronizado con la moneda del plan
  const [currency, setCurrency] = useState<Currency>(() => getCleanCurrency(plan.currency))

  // 3. Forzar actualización si el plan cambia o termina de cargar con retraso
  useEffect(() => {
    if (plan?.currency) {
      setCurrency(getCleanCurrency(plan.currency))
    }
  }, [plan?.currency])

  // 4. Calcular el precio usando la moneda real del plan
  const baseCurrency = getCleanCurrency(plan.currency)
  const price = exchangeRate
    ? convertCurrency(plan.price, baseCurrency, currency, 'sell', exchangeRate)
    : plan.price

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition hover:-translate-y-1">
      <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
        {plan.imageUrl ? (
          <img src={plan.imageUrl} alt={plan.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-body text-body-sm text-neutral-400">{t('admin.servicios.chooseImage')}</span>
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
              format={(n) => `${currencySymbol(currency)}${formatCurrency(n, currency, language)}`}
            />
          </span>
        </div>

        <div className="space-y-2xs pt-xs text-left">
          {plan.schedule && (
            <div className="font-body text-body-sm leading-relaxed text-neutral-500">
              <div className="flex items-center gap-2">
                <ClockIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                <span className="font-semibold text-neutral-600">{t('admin.servicios.scheduleLabel')}</span>
              </div>
              <p className="m-0 mt-2xs px-1 py-2xs text-left text-body-sm">{plan.schedule}</p>
            </div>
          )}

          {plan.includes && (
            <div className="font-body text-body-sm leading-relaxed text-neutral-500">
              <div className="flex items-center gap-2">
                <CircleCheckIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                <span className="font-semibold text-neutral-600">{t('admin.servicios.includesLabel')}</span>
              </div>
              <p className="m-0 mt-2xs px-1 py-2xs text-left text-body-sm line-clamp-2">{plan.includes}</p>
            </div>
          )}
        </div>

        <div className="mt-auto flex justify-end gap-sm pt-sm">
          <button 
            type="button" 
            onClick={onEdit} 
            aria-label={t('admin.edit')} 
            className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 text-green-500 transition hover:bg-green-50"
          >
            <PencilIcon size={17} />
          </button>
          <button 
            type="button" 
            onClick={onDelete} 
            disabled={deleting} 
            aria-label={t('admin.delete')} 
            className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300 text-danger transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2Icon size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}

function ServicePlanCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Skeleton shape="rect" className="h-[180px] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-sm p-lg">
        <Skeleton shape="line" className="h-5 w-3/4" />
        <Skeleton shape="line" className="h-4 w-full" />
        <Skeleton shape="line" className="h-4 w-2/3" />
        <div className="flex items-center gap-sm">
          <Skeleton shape="pill" className="h-6 w-20" />
          <Skeleton shape="line" className="h-6 w-16" />
        </div>
        <div className="mt-auto flex justify-end gap-sm pt-sm">
          <Skeleton shape="circle" className="h-10 w-10" />
          <Skeleton shape="circle" className="h-10 w-10" />
        </div>
      </div>
    </div>
  )
}

function AdminServicePlansPage() {
  const { t, i18n } = useTranslation()
  const { plans, onvoPlans, loading, error, fetchAll, createPlan, updatePlan, deletePlan } = useServicePlanAdmin()
  const { data: exchangeRate } = useExchangeRate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePlan(id)
      notify.success({
        title: t('admin.servicios.deletedToastTitle'),
        description: t('admin.servicios.deletedToastDescription'),
      })
    } catch {
      notify.error(t('admin.servicios.deleteErrorToastTitle'))
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
      setConfirmText('')
    }
  }

  const planToDelete = plans.find(p => p.id === confirmDeleteId)
  const matchesName = confirmText.trim() === (planToDelete?.name ?? '')

  return (
    <AdminLayout>
      <div className="flex flex-col gap-lg">
        <div>
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t('admin.servicios.title')}
          </h1>
          <p className="mt-2 font-body text-body text-neutral-500">
            {t('admin.servicios.subtitle')}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <PlusIcon size={18} aria-hidden="true" />
            {t('admin.servicios.addPlan')}
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3">
            <ServicePlanCardSkeleton />
            <ServicePlanCardSkeleton />
            <ServicePlanCardSkeleton />
          </div>
        )}

        {error && (
          <p className="text-center font-body text-body text-danger">{error}</p>
        )}

        {!loading && !error && plans.length === 0 && (
          <p className="text-center font-body text-body text-neutral-500">
            {t('admin.servicios.empty')}
          </p>
        )}

        {!loading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <AdminPlanCard
              key={plan.id}
              plan={plan}
              exchangeRate={exchangeRate}
              language={i18n.language} // <--- ¡Añade esto aquí!
              deleting={deletingId === plan.id}
              onEdit={() => setEditingPlan(plan)}
              onDelete={() => setConfirmDeleteId(plan.id)}
            />
          ))}
        </div>
      )}
      </div>

      {(showCreateModal || editingPlan) && (
        <CreateServicePlanModal
          onvoPlans={onvoPlans}
          existingPlans={plans}
          planToEdit={editingPlan}
          onSave={async (data, file) => {
            try {
              await createPlan(data, file)
              notify.success({
                title: t('admin.servicios.createdToastTitle'),
                description: t('admin.servicios.createdToastDescription'),
              })
            } catch (err) {
              notify.error({
                title: t('admin.servicios.saveErrorToastTitle'),
                description: t('admin.servicios.saveErrorToastDescription'),
              })
              throw err
            }
          }}
          onUpdate={async (id, data, file) => {
            try {
              await updatePlan(id, data, file)
              notify.success({
                title: t('admin.servicios.updatedToastTitle'),
                description: t('admin.servicios.updatedToastDescription'),
              })
            } catch (err) {
              notify.error({
                title: t('admin.servicios.saveErrorToastTitle'),
                description: t('admin.servicios.saveErrorToastDescription'),
              })
              throw err
            }
          }}
          onClose={() => {
            setShowCreateModal(false)
            setEditingPlan(null)
          }}
        />
      )}

      {confirmDeleteId && planToDelete && (
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal()
          }}
          onClose={() => {
            setConfirmDeleteId(null)
            setConfirmText('')
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmDeleteId(null)
              setConfirmText('')
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setConfirmDeleteId(null)
              setConfirmText('')
            }
          }}
          aria-label={t('admin.servicios.deleteTitle')}
          className="m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
        >
          <div className="relative p-[28px_22px_30px]">
            <button
              type="button"
              className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
              onClick={() => {
                setConfirmDeleteId(null)
                setConfirmText('')
              }}
              aria-label={t('admin.cancel')}
            >
              <XIcon size={20} />
            </button>

            <div className="relative mb-lg text-center">
              <h2 className="m-0 font-heading text-[36px] font-bold leading-none text-heading">
                {t('admin.servicios.deleteTitle')}
              </h2>
            </div>

            <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
              <p className="mt-2xs text-left font-body text-body text-neutral-500">
                {t('admin.servicios.deleteConfirm', { name: planToDelete.name })}
              </p>

              <div className="flex flex-col">
                <label htmlFor="admin-delete-plan-confirm" className="mb-1 font-body text-body font-normal leading-[1.6] text-body-text">
                  {t('admin.servicios.deleteConfirmField', { name: planToDelete.name })}
                </label>
                <input
                  id="admin-delete-plan-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('admin.servicios.deletePlaceholder')}
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-body-sm text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400"
                  autoFocus
                />
              </div>

            <div className="mt-sm flex gap-md">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmDeleteId(null)
                  setConfirmText('')
                }}
                className="h-11 flex-1 rounded-full font-body text-button uppercase tracking-wide"
              >
                {t('admin.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(confirmDeleteId)}
                loading={deletingId === confirmDeleteId}
                disabled={!matchesName}
                className="h-11 flex-1  rounded-full font-body text-button uppercase tracking-wide"
              >
                {deletingId === confirmDeleteId ? t('common.loading') : t('admin.delete')}
              </Button>
            </div>
            </div>
          </div>
        </dialog>
      )}
    </AdminLayout>
  )
}

export default AdminServicePlansPage
