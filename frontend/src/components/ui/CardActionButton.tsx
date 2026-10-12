/** Botón circular de acción (editar, reprogramar, destacar, eliminar) que usan las cards del admin */

import type { ButtonHTMLAttributes } from 'react'
import { CalendarClockIcon, PencilIcon, StarIcon, Trash2Icon } from '@animateicons/react/lucide'
import { tv } from 'tailwind-variants'

const cardActionButton = tv({
  base: 'inline-flex shrink-0 items-center justify-center rounded-full border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-50',
  variants: {
    action: {
      edit: 'border-green-500 text-green-500 hover:bg-green-50',
      reschedule: 'border-green-500 text-green-500 hover:bg-green-50',
      // Lleva fondo blanco porque suele ir encima de una imagen.
      feature: 'border-yellow-500 bg-white text-yellow-500 hover:bg-yellow-50',
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
    // Destacado: relleno amarillo con el ícono blanco.
    { action: 'feature', pressed: true, class: 'border-yellow-400 bg-yellow-400 text-white hover:bg-yellow-500' },
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
  // Texto para lectores de pantalla; el botón solo muestra el ícono.
  label: string
  size?: CardActionSize
  // Para acciones que son un interruptor (p. ej. destacar): marca el estado activo.
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
      <Icon size={ICON_SIZE[size]} aria-hidden="true" />
    </button>
  )
}

export default CardActionButton
