import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeftIcon, ChevronRightIcon } from '@animateicons/react/lucide'
import type { CertificateFile } from '../types/curriculum.ts'

interface CertificatesCarouselProps {
  certificates: CertificateFile[]
}

function CertificatesCarousel({ certificates }: CertificatesCarouselProps) {
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
      <p className="m-0 mb-sm font-body text-sm font-semibold text-heading">
        {t('admin.curriculums.certificates')}
      </p>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-sm">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasMultiple}
            aria-label={t('admin.curriculums.certificatePrev')}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-body-text shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <ChevronLeftIcon size={18} aria-hidden="true" />
          </button>

          <div className="h-70 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {isImage ? (
              <img src={current.fileUrl} alt={current.fileName} className="h-full w-full object-contain" />
            ) : (
              <iframe src={current.fileUrl} title={current.fileName} className="h-full w-full" />
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!hasMultiple}
            aria-label={t('admin.curriculums.certificateNext')}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-body-text shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <ChevronRightIcon size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="m-0 mt-xs truncate text-center font-body text-xs text-neutral-500">
          {current.fileName} · {t('admin.curriculums.certificateCounter', { current: index + 1, total: certificates.length })}
        </p>
      </div>
    </div>
  )
}

export default CertificatesCarousel
