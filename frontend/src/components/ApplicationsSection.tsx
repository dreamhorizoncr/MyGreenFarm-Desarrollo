import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, SearchIcon } from '@animateicons/react/lucide'
import CurriculumCard from './CurriculumCard.tsx'
import DeleteCurriculumModal from './DeleteCurriculumModal.tsx'
import { ALL_VACANCIES, useApplicationFilters } from '../hooks/useApplicationFilters.ts'
import type { Curriculum } from '../types/curriculum.ts'
import type { Vacancy } from '../types/vacancy.ts'

interface ApplicationsSectionProps {
  curriculums: Curriculum[]
  vacancies: Vacancy[]
  loading: boolean
  error: string | null
  onApprove: (application: Curriculum) => void
  onReject: (application: Curriculum) => void
  onDelete: (id: string) => Promise<void>
}

function ApplicationsSection({ curriculums, vacancies, loading, error, onApprove, onReject, onDelete }: ApplicationsSectionProps) {
  const { t } = useTranslation()
  const { searchTerm, setSearchTerm, vacancyFilter, setVacancyFilter, vacancyTitleById, filteredApplications } =
    useApplicationFilters(curriculums, vacancies)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applicationToDelete, setApplicationToDelete] = useState<Curriculum | null>(null)

  const handleToggleExpand = (id: string) => () =>
    setExpandedId((prev) => (prev === id ? null : id))

  return (
    <>
      <div className="mb-lg flex flex-wrap items-center gap-md">
        <div className="flex h-11 min-w-60 max-w-105 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
          <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-[15px] text-body-text outline-none placeholder:text-neutral-400"
            placeholder={t('admin.curriculums.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('admin.curriculums.searchPlaceholder')}
          />
        </div>

        <div className="relative">
          <select
            value={vacancyFilter}
            onChange={(e) => setVacancyFilter(e.target.value)}
            className="h-11 appearance-none rounded-full border border-neutral-200 bg-white py-sm pl-md pr-xl font-body text-sm text-body-text outline-none focus:border-green-500"
          >
            <option value={ALL_VACANCIES}>{t('admin.curriculums.allVacancies')}</option>
            {vacancies.map((v) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
          <ChevronDownIcon
            size={16}
            className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
        </div>
      </div>

      {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}
      {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

      {!loading && !error && (
        filteredApplications.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
            {t('admin.curriculums.noResults')}
          </p>
        ) : (
          <div className="flex flex-col gap-md">
            {filteredApplications.map((application) => (
              <CurriculumCard
                key={application.id}
                application={application}
                vacancyTitle={vacancyTitleById.get(application.vacancyId) ?? '—'}
                isExpanded={expandedId === application.id}
                onToggleExpand={handleToggleExpand(application.id)}
                onApprove={() => onApprove(application)}
                onReject={() => onReject(application)}
                onDelete={() => setApplicationToDelete(application)}
              />
            ))}
          </div>
        )
      )}

      {applicationToDelete && (
        <DeleteCurriculumModal
          application={applicationToDelete}
          onConfirm={onDelete}
          onClose={() => setApplicationToDelete(null)}
        />
      )}
    </>
  )
}

export default ApplicationsSection
