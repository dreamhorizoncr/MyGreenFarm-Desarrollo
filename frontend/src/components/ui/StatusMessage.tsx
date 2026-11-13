import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CloudOff, RotateCw, Sprout } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type StatusMessageProps = Readonly<{
  variant?: 'empty' | 'error'
  title?: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  onRetry?: () => void
  compact?: boolean
  className?: string
}>

function StatusMessage({
  variant = 'empty',
  title,
  description,
  icon,
  action,
  onRetry,
  compact = false,
  className = '',
}: StatusMessageProps) {
  const { t } = useTranslation()
  const isError = variant === 'error'
  const Icon = icon ?? (isError ? CloudOff : Sprout)
  const heading = title ?? t(isError ? 'common.status.errorTitle' : 'common.status.emptyTitle')
  const text = description ?? (isError ? t('common.errors.network') : undefined)

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mx-auto flex w-full flex-col items-center rounded-3xl border border-neutral-200 bg-white text-center ${
        compact ? 'max-w-full gap-sm p-lg' : 'col-span-full min-h-[20rem] justify-center gap-md p-xl shadow-md md:p-2xl'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full ${compact ? 'size-14' : 'size-20'} ${
          isError ? 'bg-[var(--orange-50)] text-orange-500' : 'bg-[var(--green-50)] text-green-500'
        }`}
      >
        <Icon size={compact ? 28 : 40} strokeWidth={1.6} />
      </span>

      <h2 className={`m-0 font-heading font-bold leading-snug text-heading ${compact ? 'text-h6' : 'text-h4'}`}>{heading}</h2>

      {text && (
        <p className={`m-0 max-w-[30rem] font-body leading-[1.6] text-body-text ${compact ? 'text-body-sm' : 'text-body'}`}>{text}</p>
      )}

      {action}

      {isError && !action && (
        <button
          type="button"
          onClick={onRetry ?? (() => window.location.reload())}
          className="mt-xs inline-flex h-11 items-center gap-xs whitespace-nowrap rounded-full blob-fill bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-500)]"
        >
          <RotateCw size={16} aria-hidden="true" />
          {t('common.status.retry')}
        </button>
      )}
    </div>
  )
}

export default StatusMessage
