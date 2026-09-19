import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface BlobButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  variant?: 'outline' | 'filled'
  children: ReactNode
}

function BlobButton({ type = 'button', className, variant = 'outline', children, ...rest }: BlobButtonProps) {
  const variantClassName = variant === 'filled' ? 'blob-btn--filled' : ''

  return (
    <button type={type} className={`blob-btn ${variantClassName} ${className ?? ''}`} {...rest}>
      {children}
      <span className="blob-btn__inner">
        <span className="blob-btn__blobs">
          <span className="blob-btn__blob" />
          <span className="blob-btn__blob" />
          <span className="blob-btn__blob" />
          <span className="blob-btn__blob" />
        </span>
      </span>
    </button>
  )
}

export default BlobButton
