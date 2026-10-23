
import type { ButtonHTMLAttributes } from 'react'
import { CalendarClockIcon, PencilIcon, StarIcon, Trash2Icon } from '@animateicons/react/lucide'
import { tv } from 'tailwind-variants'

const cardActionButton = tv({
  base: 'inline-flex shrink-0 items-center justify-center rounded-full border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    action: {
      edit: 'border-green-500 text-green-500 hover:bg-green-50',
      reschedule: 'border-green-500 text-green-500 hover:bg-green-50',
      feature: 'border-transparent bg-transparent text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.55)] hover:scale-110',
      delete: 'border-red-300 text-danger hover:bg-red-50',
    },
    size: {
      md: 'size-10',
      sm: 'size-9',
    },
    pressed: {
      true: '',
    },
  },
  compoundVariants: [
    { action: 'feature', pressed: true, class: 'text-yellow-400' },
  ],
  defaultVariants: {
    size: 'md',
  },
})

const ICONS = { edit: PencilIcon, reschedule: CalendarClockIcon, feature: StarIcon, delete: Trash2Icon } as const
const ICON_SIZE = { md: 17, sm: 16 } as const

type CardAction = keyof typeof ICONS
type CardActionSize = keyof typeof ICON_SIZE

interface CardActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'aria-pressed'> {
  action: CardAction
  label: string
  size?: CardActionSize
  pressed?: boolean
}

function CardActionButton({ action, label, size = 'md', pressed, type = 'button', className, ...rest }: Readonly<CardActionButtonProps>) {
  const Icon = ICONS[action]

  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cardActionButton({ action, size, pressed: Boolean(pressed), className })}
      {...rest}
    >
      <Icon
        size={action === 'feature' ? 24 : ICON_SIZE[size]}
        aria-hidden="true"
        className={action === 'feature' && pressed ? '[&_path]:fill-current [&_polygon]:fill-current' : ''}
      />
    </button>
  )
}

export default CardActionButton
