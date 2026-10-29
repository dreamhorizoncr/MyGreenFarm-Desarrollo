
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDownIcon, Trash2Icon } from '@animateicons/react/lucide'

interface ImageThumbProps {
  src?: string
  file?: File
  label?: string
  onDelete?: () => void
  deleteLabel?: string
  altText?: string
  onAltChange?: (value: string) => void
  altLabel?: string
  altPlaceholder?: string
  altError?: string | null
}

function ImageThumb({ src, file, label, onDelete, deleteLabel, altText, onAltChange, altLabel, altPlaceholder, altError }: Readonly<ImageThumbProps>) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!file || !imgRef.current) return
    const url = URL.createObjectURL(file)
    imgRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const withAlt = Boolean(onAltChange)

  return (
    <div className={`flex items-center gap-sm rounded-xl border bg-white p-xs pr-sm ${withAlt ? 'w-full' : ''} ${altError ? 'border-danger' : 'border-neutral-200'}`}>
      <img ref={imgRef} src={file ? undefined : src} alt="" className="size-16 shrink-0 rounded-lg bg-neutral-100 object-cover" />

      {withAlt ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2xs">
          {label && <span className="truncate font-body text-caption font-normal text-neutral-500">{label}</span>}
          <input
            type="text"
            value={altText ?? ''}
            onChange={(event) => onAltChange?.(event.target.value)}
            aria-label={altLabel}
            aria-invalid={Boolean(altError)}
            placeholder={altPlaceholder}
            maxLength={140}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-sm font-body text-body-sm font-normal text-body-text-dark outline-none focus:border-heading"
          />
          {altError && <span className="font-body text-caption font-normal text-danger">{altError}</span>}
        </div>
      ) : (
        label && <span className="max-w-[180px] truncate font-body text-caption font-normal text-neutral-500">{label}</span>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-link"
        >
          <Trash2Icon size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

interface ImageThumbListProps {
  title?: string
  children: ReactNode
  className?: string
  collapsible?: boolean
  summary?: string
  forceOpen?: boolean
}

export function ImageThumbList({ title, children, className = 'mt-lg', collapsible = false, summary, forceOpen = false }: Readonly<ImageThumbListProps>) {
  const [open, setOpen] = useState(false)
  const expanded = !collapsible || open || forceOpen

  return (
    <div className={className}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-md rounded-xl border border-neutral-200 bg-white px-md py-sm text-left transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          <span className="flex min-w-0 flex-col">
            <span className="font-body text-body-sm font-semibold text-heading">{title}</span>
            {summary && <span className="font-body text-caption font-normal text-neutral-500">{summary}</span>}
          </span>
          <ChevronDownIcon size={18} aria-hidden="true" className={`shrink-0 text-heading transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        title && <h3 className="m-0 mb-sm font-body text-body-sm font-semibold text-heading">{title}</h3>
      )}
      {expanded && <div className={`flex flex-wrap gap-md ${collapsible ? 'mt-sm' : ''}`}>{children}</div>}
    </div>
  )
}

export default ImageThumb
