
import type { ButtonHTMLAttributes } from 'react'
import { XIcon } from '@animateicons/react/lucide'

interface ModalCloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  className?: string
}

function ModalCloseButton({ className = '', ...props }: Readonly<ModalCloseButtonProps>) {
  return (
    <button
      type="button"
      {...props}
      className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${className}`}
    >
      <XIcon size={20} aria-hidden="true" />
    </button>
  )
}

export default ModalCloseButton
