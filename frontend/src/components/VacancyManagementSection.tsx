import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateVacancyModal from './CreateVacancyModal.tsx'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import Skeleton from './ui/Skeleton.tsx'
import Pagination from './ui/Pagination.tsx'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import type { Vacancy, VacancyInput } from '../types/vacancy.ts'
import CardActionButton from './ui/CardActionButton.tsx'
import SkeletonList from './ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

interface AdminVacancyCardProps {
  vacancy?: Vacancy
  applicantNameById?: Map<string, string>
  onDelete?: () => void
  onRelease?: () => void
  onSetOpen?: () => void
  loading?: boolean
}

function AdminVacancyCard({ vacancy, applicantNameById, onDelete, onRelease, onSetOpen, loading = false }: Readonly<AdminVacancyCardProps>) {
  const { t } = useTranslation()

  const openStateLabel = (isOpen: boolean) =>
    isOpen ? t('vacancies.statusOpen') : t('vacancies.statusClosed')

  if (loading) {
    return (
      <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <div className="flex items-start justify-between gap-sm">
          <Skeleton shape="line" className="h-5 w-1/2" />
          <Skeleton shape="circle" className="size-9 shrink-0" />
        </div>
        <Skeleton shape="line" className="mt-sm h-4 w-full" />
        <Skeleton shape="line" className="mt-2 h-4 w-2/3" />
        <div className="mt-md flex items-center justify-between gap-md">
          <Skeleton shape="line" className="h-4 w-24" />
          <Skeleton shape="pill" className="h-9 w-24" />
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm card-hover">
      <div className="flex items-start justify-between gap-sm">
        <h3 className="m-0 font-heading text-h5 font-bold leading-snug text-heading">
          {vacancy!.title}
        </h3>

        <CardActionButton action="delete" size="sm" label={t('admin.delete')} title={t('admin.delete')} onClick={onDelete} />
      </div>

      <p className="mt-sm flex-1 font-body text-body-sm text-body-text">
        {vacancy!.description}
      </p>

      <div className="mt-md flex flex-wrap items-center justify-between gap-md">
        <span className="inline-flex items-center gap-xs font-body text-body-sm font-semibold text-body-text">
          <span
            className={`inline-block size-2.5 rounded-full ${statusDotClass(vacancy!)}`}
            aria-hidden="true"
          />
          {vacancy!.filledByApplicationId
            ? t('vacancies.statusFilled', { name: applicantNameById!.get(vacancy!.filledByApplicationId) ?? '—' })
            : openStateLabel(vacancy!.isOpen)}
        </span>

        {vacancy!.filledByApplicationId ? (
          <button
            type="button"
            onClick={onRelease}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-green-500 px-md font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
          >
            {t('vacancies.release')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSetOpen}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-green-500 px-md font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
          >
            {vacancy!.isOpen ? t('vacancies.close') : t('vacancies.reopen')}
          </button>
        )}
      </div>
    </article>
  )
}

interface VacancyManagementSectionProps {
  vacancies: Vacancy[]
  loading: boolean
  error: string | null
  applicantNameById: Map<string, string>
  onCreate: (data: VacancyInput) => Promise<void>
  showCreateModal: boolean
  onCloseCreateModal: () => void
  onSetOpen: (id: string, isOpen: boolean) => void
  onRelease: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

function statusDotClass(vacancy: Vacancy) {
  if (vacancy.filledByApplicationId) return 'bg-info'
  return vacancy.isOpen ? 'bg-green-500' : 'bg-neutral-300'
}

function VacancyManagementSection({ vacancies, loading, error, applicantNameById, onCreate, showCreateModal, onCloseCreateModal, onSetOpen, onRelease, onDelete,}: Readonly<VacancyManagementSectionProps>) {
  const { t } = useTranslation()
  const [vacancyToDelete, setVacancyToDelete] = useState<Vacancy | null>(null)
  const { currentPage, setPage, totalPages, pageItems: pagedVacancies } = useClientPagination(vacancies)

  const skeletonCount = useSkeletonCount('admin-vacancies', loading, pagedVacancies.length, 2)

  return (
    <>
      {loading && (
        <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
          <SkeletonList count={skeletonCount}>{() => <AdminVacancyCard loading />}</SkeletonList>
        </div>
      )}
      {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

      {!loading && !error && (
        vacancies.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-body text-neutral-500">
            {t('vacancies.noVacancies')}
          </p>
        ) : (
          <>
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            {pagedVacancies.map((vacancy) => (
              <AdminVacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                applicantNameById={applicantNameById}
                onDelete={() => setVacancyToDelete(vacancy)}
                onRelease={() => onRelease(vacancy.id)}
                onSetOpen={() => onSetOpen(vacancy.id, !vacancy.isOpen)}
              />
            ))}
          </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )
      )}

      {showCreateModal && (
        <CreateVacancyModal onCreate={onCreate} onClose={onCloseCreateModal} />
      )}

      {vacancyToDelete && (
        <DeleteConfirmModal
          title={t('vacancies.deleteModalTitle')}
          message={t('vacancies.deleteConfirmMessage', { title: vacancyToDelete.title })}
          onConfirm={() => onDelete(vacancyToDelete.id)}
          onClose={() => setVacancyToDelete(null)}
        />
      )}
    </>
  )
}

export default VacancyManagementSection
