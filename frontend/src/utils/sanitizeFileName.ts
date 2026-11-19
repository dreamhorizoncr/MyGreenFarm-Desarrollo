/**
 * Makes a file name safe for storage: removes accents and replaces any character other than letters,
 * digits, dots, hyphens and underscores with `_`. The extension is kept.
 *
 * @param name - original file name
 * @returns the safe name, `archivo` plus the extension if nothing is left
 */
export function sanitizeFileName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')

  const dot = normalized.lastIndexOf('.')
  const ext = dot === -1 ? '' : normalized.slice(dot)
  const base = dot === -1 ? normalized : normalized.slice(0, dot)
  const clean = base.replace(/[^a-zA-Z0-9_-]/g, '_') || 'archivo'

  return clean + ext
}

/**
 * @param file - file chosen by the user
 * @returns a copy of the file with a safe name (see {@link sanitizeFileName}), ready to upload
 */
export function withSafeName(file: File): File {
  return new File([file], sanitizeFileName(file.name), { type: file.type })
}
