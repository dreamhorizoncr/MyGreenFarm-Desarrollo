import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Props of {@link BlobButton}; the rest go to the `<button>`. */
interface BlobButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  variant?: 'outline' | 'filled'
  children: ReactNode
}

/** Rounded button whose fill grows like a blob on hover (see {@link BlobGooFilter}). */
function BlobButton({ type = 'button', className, variant = 'outline', children, ...rest }: Readonly<BlobButtonProps>) {
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
