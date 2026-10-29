import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '@animateicons/react/lucide'
import CertificatesCarousel from './CertificatesCarousel.tsx'
import Skeleton from './ui/Skeleton.tsx'
import type { Curriculum } from '../types/curriculum.ts'
import CardActionButton from './ui/CardActionButton.tsx'
import PdfViewer from './ui/PdfViewer.tsx'

interface CurriculumCardProps {
  application?: Curriculum
  vacancyTitle?: string
  isExpanded?: boolean
  onToggleExpand?: () => void
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
  loading?: boolean
}

function StatusBadge({ status }: Readonly<{ status: Curriculum['status'] }>) {
  const { t } = useTranslation()

  const config = {
    PENDING: { dot: 'bg-orange-500', label: t('admin.curriculums.statusPending') },
    APPROVED: { dot: 'bg-green-500', label: t('admin.curriculums.statusApproved') },
    REJECTED: { dot: 'bg-danger', label: t('admin.curriculums.statusRejected') },
  }[status]

  return (
    <span className="inline-flex items-center gap-xs whitespace-nowrap font-body text-body-sm font-semibold text-body-text">
      <span className={`inline-block size-2.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}

function CurriculumCard({ application, vacancyTitle, isExpanded,  onToggleExpand, onApprove, onReject, onDelete, loading = false }: Readonly<CurriculumCardProps>) {
  const { t } = useTranslation()

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-md shadow-sm card-hover sm:p-lg">
      <div className="flex items-center justify-between gap-sm">
        {loading ? (
          <div className="flex min-w-0 flex-1 items-center gap-sm">
            <div className="min-w-0 flex-1">
              <Skeleton shape="line" className="h-5 w-1/3" />
              <Skeleton shape="line" className="mt-2 h-3 w-2/3" />
            </div>
            <Skeleton shape="line" className="h-4 w-24" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex min-w-0 flex-1 flex-col items-start gap-xs text-left focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 sm:flex-row sm:items-center sm:gap-sm"
            aria-expanded={isExpanded}
          >
            <div className="w-full min-w-0 flex-1">
              <h3 className="m-0 font-heading text-h5 font-bold leading-snug text-heading">
                {application!.applicantName}
              </h3>
              <p className="m-0 mt-2xs wrap-break-word font-body text-body-sm text-neutral-500">
                {application!.applicantEmail} · {vacancyTitle}
              </p>
            </div>

            <StatusBadge status={application!.status} />
          </button>
        )}

        {loading ? (
          <>
            <Skeleton shape="circle" className="size-9 shrink-0" />
            <Skeleton shape="circle" className="size-9 shrink-0" />
          </>
        ) : (
          <>
            <CardActionButton action="delete" size="sm" label={t('admin.delete')} title={t('admin.delete')} onClick={onDelete} />

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
          </>
        )}
      </div>

      {!loading && isExpanded && (
        <div className="mt-md border-t border-neutral-200 pt-md">
          {application!.applicantPhone && (
            <p className="m-0 mb-sm font-body text-body-sm text-neutral-500">
              {application!.applicantPhone}
            </p>
          )}

          {application!.fileUrl && (
            <PdfViewer
              url={application!.fileUrl}
              fileName={application!.fileName}
              title={`${t('admin.curriculums.view')} - ${application!.applicantName}`}
              className="h-105 sm:h-130"
            />
          )}

          <CertificatesCarousel certificates={application!.certificates} />

          <div className="mt-md flex justify-end gap-sm sm:gap-md">
            <button
              type="button"
              onClick={onApprove}
              disabled={application!.status !== 'PENDING'}
              className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-green-500 px-sm sm:px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-35 sm:flex-none"
            >
              {t('admin.curriculums.approve')}
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={application!.status !== 'PENDING'}
              className="inline-flex h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-orange-500 px-sm sm:px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-35 sm:flex-none"
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
