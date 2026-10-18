import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeftIcon, ChevronRightIcon } from '@animateicons/react/lucide'
import type { CertificateFile } from '../types/curriculum.ts'
import PdfViewer from './ui/PdfViewer.tsx'

interface CertificatesCarouselProps {
  certificates: CertificateFile[]
}

function CertificatesCarousel({ certificates }: Readonly<CertificatesCarouselProps>) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)

  if (certificates.length === 0) return null

  const current = certificates[index]
  const isImage = current.fileUrl.startsWith('data:image/')
  const hasMultiple = certificates.length > 1

  const goPrev = () => setIndex((prev) => (prev === 0 ? certificates.length - 1 : prev - 1))
  const goNext = () => setIndex((prev) => (prev === certificates.length - 1 ? 0 : prev + 1))

  return (
    <div className="mt-md">
      <p className="m-0 mb-sm font-body text-body-sm font-semibold text-heading">
        {t('admin.curriculums.certificates')}
      </p>

      {isImage ? (
        <div className="h-90 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-sm">
          <img src={current.fileUrl} alt={current.fileName} className="h-full w-full object-contain" />
        </div>
      ) : (
        <PdfViewer key={current.id} url={current.fileUrl} fileName={current.fileName} title={current.fileName} className="h-90" />
      )}

      {hasMultiple && (
        <div className="mt-sm flex items-center justify-between gap-sm">
          <button type="button" onClick={goPrev} aria-label={t('admin.curriculums.certificatePrev')} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-(--grey-100) hover:text-heading focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
            <ChevronLeftIcon size={18} aria-hidden="true" />
          </button>
          <p className="m-0 min-w-0 truncate text-center font-body text-caption font-semibold text-neutral-500">
            {t('admin.curriculums.certificateCounter', { current: index + 1, total: certificates.length })}
          </p>
          <button type="button" onClick={goNext} aria-label={t('admin.curriculums.certificateNext')} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-(--grey-100) hover:text-heading focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
            <ChevronRightIcon size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default CertificatesCarousel
