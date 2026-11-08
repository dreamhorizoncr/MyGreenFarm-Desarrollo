import { useTranslation } from 'react-i18next'
import type { ChatBookingOption } from '../../hooks/useChatBooking.ts'

interface ChatBookingOptionsProps {
  options: ChatBookingOption[]
  disabled?: boolean
  onSelect: (optionId: string) => void
}

const variantClassName = (variant: ChatBookingOption['variant']) => {
  if (variant === 'primary') {
    return 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600'
  }
  if (variant === 'danger') {
    return 'border-danger bg-white text-danger hover:bg-red-50'
  }
  return 'border-green-500 bg-white text-heading hover:bg-green-50'
}

export default function ChatBookingOptions({
  options,
  disabled = false,
  onSelect,
}: Readonly<ChatBookingOptionsProps>) {
  const { t } = useTranslation()

  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-xs" role="group" aria-label={t('chat.booking.options')}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          disabled={disabled || option.disabled}
          className={`inline-flex h-9 items-center justify-center rounded-full border px-sm font-body text-caption font-semibold transition-colors disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:bg-neutral-100 ${variantClassName(option.variant)}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
