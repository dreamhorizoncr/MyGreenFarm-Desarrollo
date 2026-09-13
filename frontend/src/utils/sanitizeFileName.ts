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