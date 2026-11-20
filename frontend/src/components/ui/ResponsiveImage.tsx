import { useState, type ImgHTMLAttributes } from 'react'
import { responsiveImage } from '../../utils/image.ts'

/** Props of {@link ResponsiveImage}. */
interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Public URL of the image in Supabase Storage. */
  src: string
  /** Widths in pixels offered to the browser, from smallest to largest. */
  widths: readonly number[]
  /** Width the image is shown at, for example `(min-width: 768px) 33vw, 100vw`. */
  sizes: string
}

/**
 * Image from Supabase Storage downloaded at the size it is shown instead of the original file. If
 * the resized version cannot be loaded, it falls back to the original.
 */
function ResponsiveImage({ src, widths, sizes, onError, ...props }: Readonly<ResponsiveImageProps>) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const resized = failedSrc === src ? { src } : responsiveImage(src, widths)

  return (
    <img
      {...props}
      src={resized.src}
      srcSet={resized.srcSet}
      sizes={resized.srcSet ? sizes : undefined}
      onError={(event) => {
        if (resized.srcSet) setFailedSrc(src)
        else onError?.(event)
      }}
    />
  )
}

export default ResponsiveImage
