import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DownloadIcon, FileTextIcon, MinusIcon, PlusIcon, SquareArrowOutUpRightIcon } from '@animateicons/react/lucide'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import Skeleton from './Skeleton.tsx'

GlobalWorkerOptions.workerSrc = workerSrc

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const PAGE_GAP = 16

interface PdfViewerProps {
  url: string
  fileName?: string | null
  title: string
  className?: string
}

const iconButtonClass =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-(--grey-100) hover:text-heading disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2'

function PdfPage({ pdf, pageNumber, width, label }: Readonly<{ pdf: PDFDocumentProxy; pageNumber: number; width: number; label: string }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ratio, setRatio] = useState(1.294)

  useEffect(() => {
    let cancelled = false
    let task: { cancel: () => void; promise: Promise<void> } | null = null
    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber)
      const canvas = canvasRef.current
      if (cancelled || !canvas || width <= 0) return
      const base = page.getViewport({ scale: 1 })
      setRatio(base.height / base.width)
      const dpr = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: (width / base.width) * dpr })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      task = page.render({ canvas, viewport })
      await task.promise
    }
    renderPage().catch(() => undefined)
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [pdf, pageNumber, width])

  return (
    <>
      <span className="sr-only">{label}</span>
      <canvas
        ref={canvasRef}
        data-page={pageNumber}
        aria-hidden="true"
        style={{ width, height: width * ratio }}
        className="mx-auto block rounded-lg bg-white shadow-[0_2px_12px_rgb(0_0_0/0.08)]"
      />
    </>
  )
}

function PdfViewer({ url, fileName, title, className = 'h-105' }: Readonly<PdfViewerProps>) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(2)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const task = getDocument({url})
    task.promise
      .then((doc) => { if (!cancelled) setPdf(doc) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => {
      cancelled = true
      void task.destroy()
    }
  }, [url])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const middle = el.getBoundingClientRect().top + el.clientHeight / 2
    const pages = [...el.querySelectorAll<HTMLCanvasElement>('canvas[data-page]')]
    const visible = pages.find((page) => page.getBoundingClientRect().bottom >= middle)
    if (visible) setCurrentPage(Number(visible.dataset.page))
  }

  const zoom = ZOOM_STEPS[zoomIndex]
  const pageWidth = Math.max(0, containerWidth * zoom)
  const total = pdf?.numPages ?? 0

  return (
    <div className={`flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white ${className}`}>
      <div className="flex items-center gap-xs border-b border-neutral-200 px-sm py-xs sm:gap-sm sm:px-md">
        <FileTextIcon size={18} aria-hidden="true" className="shrink-0 text-heading" />
        <span className="min-w-0 flex-1 truncate font-body text-body-sm font-semibold text-heading" title={fileName ?? title}>
          {fileName ?? title}
        </span>

        {total > 0 && (
          <span className="hidden shrink-0 rounded-full bg-neutral-100 px-sm py-2xs font-body text-caption font-semibold text-neutral-500 sm:inline">
            {t('pdfViewer.pageCounter', { current: currentPage, total })}
          </span>
        )}

        <div className="hidden shrink-0 items-center sm:flex">
          <button type="button" onClick={() => setZoomIndex((i) => i - 1)} disabled={!pdf || zoomIndex === 0} aria-label={t('pdfViewer.zoomOut')} title={t('pdfViewer.zoomOut')} className={iconButtonClass}>
            <MinusIcon size={16} aria-hidden="true" />
          </button>
          <span className="hidden w-11 text-center font-body text-caption font-semibold text-neutral-500 sm:inline" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => setZoomIndex((i) => i + 1)} disabled={!pdf || zoomIndex === ZOOM_STEPS.length - 1} aria-label={t('pdfViewer.zoomIn')} title={t('pdfViewer.zoomIn')} className={iconButtonClass}>
            <PlusIcon size={16} aria-hidden="true" />
          </button>
        </div>

        <span className="mx-2xs hidden h-5 w-px bg-neutral-200 sm:block" aria-hidden="true" />

        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t('pdfViewer.open')} title={t('pdfViewer.open')} className={iconButtonClass}>
          <SquareArrowOutUpRightIcon size={16} aria-hidden="true" />
        </a>
        <a href={url} download={fileName ?? true} target="_blank" rel="noopener noreferrer" aria-label={t('pdfViewer.download')} title={t('pdfViewer.download')} className={iconButtonClass}>
          <DownloadIcon size={16} aria-hidden="true" />
        </a>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        aria-label={title}
        className="modal-scroll min-h-0 flex-1 overflow-auto bg-neutral-50 p-sm sm:p-md"
      >
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-sm text-center">
            <p className="m-0 font-body text-body-sm text-neutral-500">{t('pdfViewer.error')}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-xs rounded-full border border-green-500 px-md font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50">
              <SquareArrowOutUpRightIcon size={16} aria-hidden="true" />
              {t('pdfViewer.open')}
            </a>
          </div>
        )}

        {!error && !pdf && (
          <output className="mx-auto flex flex-col gap-md" style={{ width: pageWidth || '100%' }} aria-label={t('pdfViewer.loading')}>
            <Skeleton className="aspect-[1/1.294] w-full rounded-lg" />
          </output>
        )}

        {pdf && pageWidth > 0 && (
          <div className="flex flex-col" style={{ gap: PAGE_GAP, width: pageWidth > containerWidth ? pageWidth : undefined }}>
            {Array.from({ length: total }, (_, i) => (
              <PdfPage key={i + 1} pdf={pdf} pageNumber={i + 1} width={pageWidth} label={t('pdfViewer.pageLabel', { page: i + 1 })} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PdfViewer
