/** Botón circular de acción (editar, reprogramar, eliminar) que usan las cards del admin */

import type { ButtonHTMLAttributes } from 'react'
import { CalendarClockIcon, PencilIcon, Trash2Icon } from '@animateicons/react/lucide'
import { tv } from 'tailwind-variants'

const cardActionButton = tv({
  base: 'inline-flex shrink-0 items-center justify-center rounded-full border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    action: {
      edit: 'border-green-500 text-green-500 hover:bg-green-50',
      reschedule: 'border-green-500 text-green-500 hover:bg-green-50',
      delete: 'border-red-300 text-danger hover:bg-red-50',
    },
    size: {
      md: 'size-10',
      sm: 'size-9',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const ICONS = { edit: PencilIcon, reschedule: CalendarClockIcon, delete: Trash2Icon } as const
const ICON_SIZE = { md: 17, sm: 16 } as const

type CardAction = keyof typeof ICONS
type CardActionSize = keyof typeof ICON_SIZE

interface CardActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  action: CardAction
  // Texto para lectores de pantalla; el botón solo muestra el ícono.
  label: string
  size?: CardActionSize
}

function CardActionButton({ action, label, size = 'md', type = 'button', className, ...rest }: Readonly<CardActionButtonProps>) {
  const Icon = ICONS[action]

  return (
    <button type={type} aria-label={label} className={cardActionButton({ action, size, className })} {...rest}>
      <Icon size={ICON_SIZE[size]} aria-hidden="true" />
    </button>
  )
}

export default CardActionButton
