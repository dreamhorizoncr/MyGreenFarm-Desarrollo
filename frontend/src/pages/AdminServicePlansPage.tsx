import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, Trash2Icon, PencilIcon, XIcon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import Button from '../components/ui/Button.tsx'
import CreateServicePlanModal from '../components/CreateServicePlanModal.tsx'
import { useServicePlanAdmin } from '../hooks/useServicePlanAdmin.ts'
import { notify } from '../utils/notifications.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'

function AdminServicePlansPage() {
  const { t } = useTranslation()
  const { plans, onvoPlans, loading, error, fetchAll, createPlan, updatePlan, deletePlan } = useServicePlanAdmin()
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
          <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
            {t('admin.servicios.title')}
          </h1>
          <p className="mt-2 font-body text-base text-neutral-500">
            {t('admin.servicios.subtitle')}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-sm font-semibold text-white"
          >
            <PlusIcon size={18} aria-hidden="true" />
            {t('admin.servicios.addPlan')}
          </button>
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
                      {/* No tiene que ser ANY, cambiarlo luego */}
                      {getPlanTypeLabel(plan.type, t as any)} 
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

                  <div className="flex justify-end gap-sm pt-sm">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(plan)}
                      className="flex items-center gap-xs rounded-full px-md py-xs font-body text-xs text-heading transition-colors hover:bg-neutral-50"
                    >
                      <PencilIcon size={14} />
                      {t('admin.edit')}
                    </button>
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
            className="relative max-h-[90vh] w-[min(620px,92vw)] overflow-y-auto scrollbar-none rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-label={t('admin.servicios.deleteTitle')}
          >
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
              <p className="mt-2xs text-left font-body text-[16px] text-neutral-500">
                {t('admin.servicios.deleteConfirm', { name: planToDelete.name })}
              </p>

              <div className="flex flex-col">
                <label htmlFor="admin-delete-plan-confirm" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
                  {t('admin.servicios.deleteConfirmField', { name: planToDelete.name })}
                </label>
                <input
                  id="admin-delete-plan-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('admin.servicios.deletePlaceholder')}
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400"
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
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminServicePlansPage
