import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'
import CurriculumCard from './CurriculumCard.tsx'
import ConfirmCurriculumDecisionModal from './ConfirmCurriculumDecisionModal.tsx'
import DeleteCurriculumModal from './DeleteCurriculumModal.tsx'
import Skeleton from './ui/Skeleton.tsx'
import Pagination from './ui/Pagination.tsx'
import Select from './ui/Select.tsx'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { ALL_VACANCIES, SPONTANEOUS_APPLICATIONS, useApplicationFilters } from '../hooks/useApplicationFilters.ts'
import type { Curriculum } from '../types/curriculum.ts'
import type { Vacancy } from '../types/vacancy.ts'

function CurriculumRowSkeleton() {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
      <div className="flex items-center justify-between gap-sm">
        <div className="min-w-0 flex-1">
          <Skeleton shape="line" className="h-5 w-1/3" />
          <Skeleton shape="line" className="mt-2 h-3 w-2/3" />
        </div>
        <Skeleton shape="line" className="h-4 w-24" />
        <Skeleton shape="circle" className="h-9 w-9 shrink-0" />
        <Skeleton shape="circle" className="h-9 w-9 shrink-0" />
      </div>
    </article>
  )
}

interface ApplicationsSectionProps {
  curriculums: Curriculum[]
  vacancies: Vacancy[]
  loading: boolean
  error: string | null
  onApprove: (application: Curriculum) => Promise<void>
  onReject: (application: Curriculum) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function ApplicationsSection({ curriculums, vacancies, loading, error, onApprove, onReject, onDelete }: Readonly<ApplicationsSectionProps>) {
  const { t } = useTranslation()
  const { searchTerm, setSearchTerm, vacancyFilter, setVacancyFilter, vacancyTitleById, filteredApplications } =
    useApplicationFilters(curriculums, vacancies)

  const { currentPage, setPage, totalPages, pageItems: pagedApplications } = useClientPagination(filteredApplications)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applicationToDelete, setApplicationToDelete] = useState<Curriculum | null>(null)
  const [applicationToDecide, setApplicationToDecide] = useState<
    { application: Curriculum; action: 'approve' | 'reject' } | null
  >(null)

  const handleToggleExpand = (id: string) => () =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <>
      <div className="mb-lg flex flex-wrap items-center gap-md">
        <div className="flex h-11 min-w-60 max-w-105 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
          <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
            placeholder={t('admin.curriculums.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('admin.curriculums.searchPlaceholder')}
          />
        </div>

        <Select
          value={vacancyFilter}
          onChange={setVacancyFilter}
          options={[
            { value: ALL_VACANCIES, label: t('admin.curriculums.allVacancies') },
            { value: SPONTANEOUS_APPLICATIONS, label: t('admin.curriculums.spontaneousApplications') },
            ...vacancies.map((v) => ({ value: v.id, label: v.title })),
          ]}
          className="w-auto min-w-[220px] rounded-full border border-neutral-200 bg-white py-sm pl-md pr-lg"
          aria-label={t('admin.curriculums.allVacancies')}
        />
      </div>

      {loading && (
        <div className="flex flex-col gap-md">
          <CurriculumRowSkeleton />
          <CurriculumRowSkeleton />
          <CurriculumRowSkeleton />
        </div>
      )}
      {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

      {!loading && !error && (
        filteredApplications.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-body text-neutral-500">
            {t('admin.curriculums.noResults')}
          </p>
        ) : (
          <>
          <div className="flex flex-col gap-md">
            {pagedApplications.map((application) => (
              <CurriculumCard
                key={application.id}
                application={application}
                vacancyTitle={
                  application.vacancyId === null
                    ? t('admin.curriculums.spontaneousApplications')
                    : (vacancyTitleById.get(application.vacancyId) ?? '—')
                }
                isExpanded={expandedId === application.id}
                onToggleExpand={handleToggleExpand(application.id)}
                onApprove={() => setApplicationToDecide({ application, action: 'approve' })}
                onReject={() => setApplicationToDecide({ application, action: 'reject' })}
                onDelete={() => setApplicationToDelete(application)}
              />
            ))}
          </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )
      )}

      {applicationToDelete && (
        <DeleteCurriculumModal
          application={applicationToDelete}
          onConfirm={onDelete}
          onClose={() => setApplicationToDelete(null)}
        />
      )}

      {applicationToDecide && (
        <ConfirmCurriculumDecisionModal
          application={applicationToDecide.application}
          action={applicationToDecide.action}
          onConfirm={applicationToDecide.action === 'approve' ? onApprove : onReject}
          onClose={() => setApplicationToDecide(null)}
        />
      )}
    </>
  )
}

export default ApplicationsSection
