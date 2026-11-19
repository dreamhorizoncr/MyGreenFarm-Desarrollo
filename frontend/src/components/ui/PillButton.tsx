import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Props of {@link PillButton}; the rest go to the `<button>`. */
interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: ReactNode
}

/** Pill-shaped secondary button. */
function PillButton({ type = 'button', className, children, ...rest }: Readonly<PillButtonProps>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-lg py-xs font-bold transition-opacity hover:opacity-90 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export default PillButton