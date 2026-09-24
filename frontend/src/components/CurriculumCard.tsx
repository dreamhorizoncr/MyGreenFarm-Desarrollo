import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, Trash2Icon } from '@animateicons/react/lucide'
import CertificatesCarousel from './CertificatesCarousel.tsx'
import type { Curriculum } from '../types/curriculum.ts'

interface CurriculumCardProps {
  application: Curriculum
  vacancyTitle: string
  isExpanded: boolean
  onToggleExpand: () => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}

function StatusBadge({ status }: { status: Curriculum['status'] }) {
  const { t } = useTranslation()

  const config = {
    PENDING: { dot: 'bg-orange-500', label: t('admin.curriculums.statusPending') },
    APPROVED: { dot: 'bg-green-500', label: t('admin.curriculums.statusApproved') },
    REJECTED: { dot: 'bg-danger', label: t('admin.curriculums.statusRejected') },
  }[status]

  return (
    <span className="inline-flex items-center gap-xs whitespace-nowrap font-body text-sm font-semibold text-body-text">
      <span className={`inline-block size-2.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}

function CurriculumCard({ application, vacancyTitle, isExpanded,  onToggleExpand, onApprove, onReject, onDelete, }: CurriculumCardProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between gap-sm">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-sm text-left focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          aria-expanded={isExpanded}
        >
          <div className="min-w-0 flex-1">
            <h3 className="m-0 font-heading text-lg font-bold leading-snug text-heading">
              {application.applicantName}
            </h3>
            <p className="m-0 mt-2xs wrap-break-word font-body text-body-sm text-neutral-500">
              {application.applicantEmail} · {vacancyTitle}
            </p>
          </div>

          <StatusBadge status={application.status} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label={t('admin.delete')}
          title={t('admin.delete')}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-transparent text-neutral-400 transition-colors hover:bg-(--grey-100) hover:text-danger focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        >
          <Trash2Icon size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? t('admin.curriculums.collapse') : t('admin.curriculums.expand')}
          aria-expanded={isExpanded}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-transparent text-neutral-500 transition-colors hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        >
          <ChevronDownIcon
            size={18}
            className={`transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-md border-t border-neutral-200 pt-md">
          {application.applicantPhone && (
            <p className="m-0 mb-sm font-body text-sm text-neutral-500">
              {application.applicantPhone}
            </p>
          )}

          {application.fileUrl && (
            <div className="h-105 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              <iframe
                src={application.fileUrl}
                title={`${t('admin.curriculums.view')} - ${application.applicantName}`}
                className="h-full w-full"
              />
            </div>
          )}

          <CertificatesCarousel certificates={application.certificates} />

          <div className="mt-md flex flex-wrap justify-end gap-md">
            <button
              type="button"
              onClick={onApprove}
              disabled={application.status !== 'PENDING'}
              className="inline-flex h-11 min-w-35 items-center justify-center whitespace-nowrap rounded-full bg-green-500 px-lg font-body text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.curriculums.approve')}
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={application.status !== 'PENDING'}
              className="inline-flex h-11 min-w-35 items-center justify-center whitespace-nowrap rounded-full bg-orange-500 px-lg font-body text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('admin.curriculums.reject')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default CurriculumCard
