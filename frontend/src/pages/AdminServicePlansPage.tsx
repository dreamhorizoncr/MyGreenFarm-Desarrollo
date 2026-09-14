import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, Trash2Icon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import Button from '../components/ui/Button.tsx'
import CreateServicePlanModal from '../components/CreateServicePlanModal.tsx'
import { useServicePlanAdmin } from '../hooks/useServicePlanAdmin.ts'

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

function AdminServicePlansPage() {
  const { t } = useTranslation()
  const { plans, stripePlans, loading, error, fetchAll, createPlan, deletePlan } = useServicePlanAdmin()
  const [showCreateModal, setShowCreateModal] = useState(false)
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
          <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
            {t('admin.servicios.title')}
          </h1>
          <p className="mt-2 font-body text-base text-neutral-500">
            {t('admin.servicios.subtitle')}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="w-auto gap-sm rounded-full px-lg py-sm font-body text-sm"
          >
            <PlusIcon size={16} />
            {t('admin.servicios.addPlan')}
          </Button>
        </div>

        {loading && (
          <p className="text-center font-body text-base text-neutral-500">{t('common.loading')}</p>
        )}

        {error && (
          <p className="text-center font-body text-base text-danger">{error}</p>
        )}

        {!loading && !error && plans.length === 0 && (
          <p className="text-center font-body text-base text-neutral-500">
            {t('admin.servicios.empty')}
          </p>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
                  {plan.imageUrl ? (
                    <img
                      src={plan.imageUrl}
                      alt={plan.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-body text-sm text-neutral-400">
                        {t('admin.servicios.chooseImage')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-sm p-lg">
                  <h3 className="m-0 font-heading text-h5 font-bold text-heading line-clamp-1">
                    {plan.name}
                  </h3>
                  <p className="m-0 font-body text-sm text-body-text-dark line-clamp-2">
                    {plan.description}
                  </p>

                  <div className="flex items-center gap-sm">
                    <span className="rounded-full bg-green-100 px-md py-xs font-body text-xs font-semibold text-green-700">
                      {getPlanTypeLabel(plan.type, t)}
                    </span>
                    <span className="font-heading text-h5 font-bold text-heading">
                      {plan.price}
                    </span>
                  </div>

                  {plan.schedule && (
                    <p className="m-0 font-body text-xs text-neutral-500">
                      <span className="font-semibold">{t('admin.servicios.scheduleLabel')}:</span>{' '}
                      {plan.schedule}
                    </p>
                  )}

                  {plan.includes && (
                    <p className="m-0 font-body text-xs text-neutral-500 line-clamp-3">
                      <span className="font-semibold">{t('admin.servicios.includesLabel')}:</span>{' '}
                      {plan.includes}
                    </p>
                  )}

                  <div className="flex justify-end pt-sm">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(plan.id)}
                      disabled={deletingId === plan.id}
                      className="flex items-center gap-xs rounded-full px-md py-xs font-body text-xs text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2Icon size={14} />
                      {t('admin.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateServicePlanModal
          stripePlans={stripePlans}
          existingPlans={plans}
          onSave={createPlan}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {confirmDeleteId && planToDelete && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmDeleteId(null)
              setConfirmText('')
            }
          }}
        >
          <div
            className="relative w-[min(480px,92vw)] rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label={t('admin.servicios.deleteTitle')}
          >
            <div className="mb-lg text-center">
              <h2 className="m-0 font-heading text-[36px] font-bold leading-none text-heading">
                {t('admin.servicios.deleteTitle')}
              </h2>
            </div>

            <p className="mb-lg text-center font-body text-base text-body-text-dark">
              {t('admin.servicios.deleteConfirm', { name: planToDelete.name })}
            </p>

            <div className="flex flex-col items-center gap-sm">
              <label className="font-body text-sm text-body-text-dark">
                {t('admin.servicios.deleteConfirmField', { name: planToDelete.name })}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t('admin.servicios.deletePlaceholder')}
                className="h-[38px] w-full max-w-[280px] rounded-xl border border-neutral-300 bg-transparent px-md font-body text-[15px] text-body-text outline-none transition-colors focus:border-danger"
                autoFocus
              />
            </div>

            <div className="flex gap-md mt-lg">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmDeleteId(null)
                  setConfirmText('')
                }}
                className="h-[47px] flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
              >
                {t('admin.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(confirmDeleteId)}
                loading={deletingId === confirmDeleteId}
                disabled={!matchesName}
                className="h-[47px] flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
              >
                {deletingId === confirmDeleteId ? t('common.loading') : t('admin.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminServicePlansPage
