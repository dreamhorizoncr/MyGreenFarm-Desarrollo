import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, Trash2Icon } from '@animateicons/react/lucide'
import CreateVacancyModal from './CreateVacancyModal.tsx'
import type { Vacancy, VacancyInput } from '../types/vacancy.ts'

interface VacancyManagementSectionProps {
  vacancies: Vacancy[]
  loading: boolean
  error: string | null
  applicantNameById: Map<string, string>
  onCreate: (data: VacancyInput) => Promise<void>
  onSetOpen: (id: string, isOpen: boolean) => void
  onRelease: (id: string) => void
  onDelete: (id: string) => void
}

function VacancyManagementSection({ vacancies, loading, error, applicantNameById, onCreate, onSetOpen, onRelease, onDelete,}: VacancyManagementSectionProps) {
  const { t } = useTranslation()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <div className="mb-lg flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-11 items-center gap-xs whitespace-nowrap rounded-full bg-orange-500 px-md font-body text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        >
          <PlusIcon size={18} aria-hidden="true" />
          <span>{t('vacancies.publish')}</span>
        </button>
      </div>

      {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}
      {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

      {!loading && !error && (
        vacancies.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
            {t('vacancies.noVacancies')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            {vacancies.map((vacancy) => (
              <article key={vacancy.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-sm">
                  <h3 className="m-0 font-heading text-lg font-bold leading-snug text-heading">
                    {vacancy.title}
                  </h3>

                  <button
                    type="button"
                    onClick={() => onDelete(vacancy.id)}
                    aria-label={t('admin.delete')}
                    title={t('admin.delete')}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-transparent text-neutral-400 transition-colors hover:bg-(--grey-100) hover:text-danger focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                  >
                    <Trash2Icon size={16} aria-hidden="true" />
                  </button>
                </div>

                <p className="mt-sm flex-1 font-body text-[15px] text-body-text">
                  {vacancy.description}
                </p>

                <div className="mt-md flex flex-wrap items-center justify-between gap-md">
                  <span className="inline-flex items-center gap-xs font-body text-sm font-semibold text-body-text">
                    <span
                      className={`inline-block size-2.5 rounded-full ${
                        vacancy.filledByApplicationId ? 'bg-info' : vacancy.isOpen ? 'bg-green-500' : 'bg-neutral-300'
                      }`}
                      aria-hidden="true"
                    />
                    {vacancy.filledByApplicationId
                      ? t('vacancies.statusFilled', { name: applicantNameById.get(vacancy.filledByApplicationId) ?? '—' })
                      : vacancy.isOpen ? t('vacancies.statusOpen') : t('vacancies.statusClosed')}
                  </span>

                  {vacancy.filledByApplicationId ? (
                    <button
                      type="button"
                      onClick={() => onRelease(vacancy.id)}
                      className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-neutral-200 px-md font-body text-sm font-semibold text-body-text hover:bg-(--grey-100)"
                    >
                      {t('vacancies.release')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetOpen(vacancy.id, !vacancy.isOpen)}
                      className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-neutral-200 px-md font-body text-sm font-semibold text-body-text hover:bg-(--grey-100)"
                    >
                      {vacancy.isOpen ? t('vacancies.close') : t('vacancies.reopen')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {showCreateModal && (
        <CreateVacancyModal onCreate={onCreate} onClose={() => setShowCreateModal(false)} />
      )}
    </>
  )
}

export default VacancyManagementSection
