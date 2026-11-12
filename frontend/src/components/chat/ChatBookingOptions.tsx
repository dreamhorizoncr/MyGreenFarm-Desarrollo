import { useTranslation } from 'react-i18next'
import type { ChatBookingOption } from '../../hooks/useChatBooking.ts'

interface ChatBookingOptionsProps {
  options: ChatBookingOption[]
  disabled?: boolean
  onSelect: (optionId: string) => void
}

const isChoice = (option: ChatBookingOption) => option.id.startsWith('day:') || option.id.startsWith('time:')

const CHOICE_CLASS =
  'rounded-full border border-green-500 bg-transparent px-md py-xs font-body text-body-sm text-heading transition-colors duration-300 hover:bg-green-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-transparent'

const ACTION_BASE =
  'inline-flex h-11 items-center justify-center rounded-full px-lg font-body text-body-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const actionClassName = (variant: ChatBookingOption['variant']) =>
  variant === 'primary' || variant === 'danger'
    ? `${ACTION_BASE} bg-orange-500 text-white hover:bg-orange-600`
    : `${ACTION_BASE} border border-green-500 bg-white text-heading hover:bg-green-50`

export default function ChatBookingOptions({
  options,
  disabled = false,
  onSelect,
}: Readonly<ChatBookingOptionsProps>) {
  const { t } = useTranslation()

  if (options.length === 0) return null

  const choices = options.filter(isChoice)
  const actions = options.filter((option) => !isChoice(option))
  const renderButton = (option: ChatBookingOption, className: string) => (
    <button
      key={option.id}
      type="button"
      onClick={() => onSelect(option.id)}
      disabled={disabled || option.disabled}
      className={className}
    >
      {option.label}
    </button>
  )

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-sm border-0 p-0" aria-label={t('chat.booking.options')}>
      {choices.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {choices.map((option) => renderButton(option, CHOICE_CLASS))}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {actions.map((option) => renderButton(option, actionClassName(option.variant)))}
        </div>
      )}
    </fieldset>
  )
}
