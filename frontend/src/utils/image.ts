const PUBLIC_OBJECT = '/storage/v1/object/public/'
const RENDER_IMAGE = '/storage/v1/render/image/public/'
/** Formats Supabase can resize; SVG and the rest are served as they are. */
const RESIZABLE = /\.(jpe?g|png|webp|avif)$/i

/** Sources of an `<img>` that loads the image at the size it is shown. */
export interface ResponsiveImage {
  src: string
  srcSet?: string
}

/**
 * @param url - public URL of an image in Supabase Storage
 * @returns whether Supabase can serve it resized
 */
export function isResizable(url: string): boolean {
  if (!url.includes(PUBLIC_OBJECT)) return false
  try {
    return RESIZABLE.test(new URL(url).pathname)
  } catch {
    return false
  }
}

/**
 * @param url - public URL of an image in Supabase Storage
 * @param width - width in pixels to resize it to, keeping its proportions
 * @param quality - compression quality, from 20 to 100
 * @returns the URL of the image resized by Supabase, which also serves it as WebP to the browsers
 *   that accept it; any other URL is returned unchanged. Spaces in the name come encoded, because
 *   in a `srcset` a space separates the URL from its width.
 */
export function resizedImageUrl(url: string, width: number, quality = 75): string {
  if (!isResizable(url)) return url
  const resized = new URL(url)
  resized.pathname = resized.pathname.replace(PUBLIC_OBJECT, RENDER_IMAGE)
  // without resize=contain Supabase keeps the original height and crops a narrow strip
  resized.search = `?width=${width}&quality=${quality}&resize=contain`
  return resized.href
}

/**
 * Photos are uploaded straight from cameras, up to 7000 pixels wide and 1 MB each, but most are
 * shown a few hundred pixels wide. This lets the browser download the smallest version that looks
 * sharp on its screen.
 *
 * @param url - public URL of an image in Supabase Storage
 * @param widths - widths offered to the browser, which picks one with the `sizes` of the `<img>`
 * @returns `src` and `srcSet` for the `<img>`; images Supabase cannot resize keep their URL
 */
export function responsiveImage(url: string, widths: readonly number[]): ResponsiveImage {
  if (!isResizable(url) || widths.length === 0) return { src: url }
  return {
    src: resizedImageUrl(url, widths.at(-1)!),
    srcSet: widths.map((width) => `${resizedImageUrl(url, width)} ${width}w`).join(', '),
  }
}
