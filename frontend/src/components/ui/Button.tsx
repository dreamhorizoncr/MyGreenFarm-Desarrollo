/** Boton con diferentes variantes y tamaños */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { tv } from 'tailwind-variants'

const button = tv({
  base: 'inline-flex items-center justify-center gap-3 w-full rounded-2xl font-semibold leading-none transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer hover:opacity-90 active:scale-[0.98]',
  variants: {
    variant: {
      primary: 'bg-primary text-white',
      secondary: 'bg-white text-primary border border-primary-200',
      ghost: 'bg-transparent text-primary',
      danger: 'bg-danger text-white',
    },
    size: {
      sm: 'px-4 py-3 text-sm',
      md: 'px-6 py-4 text-base',
      lg: 'px-8 py-6 text-lg',
    },
    isDisabled: {
      true: 'opacity-50 cursor-not-allowed hover:opacity-50 active:scale-100',
    },
    isLoading: {
      true: 'opacity-50 cursor-not-allowed hover:opacity-50 active:scale-100',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={button({
        variant,
        size,
        isDisabled: disabled,
        isLoading: loading,
        className,
      })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="size-4 border-2 border-current border-r-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      <span className="inline-flex items-center">{children}</span>
    </button>
  )
}

export default Button
