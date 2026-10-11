/** Botón para elegir imágenes en los formularios del admin (input file oculto + texto de ayuda) */

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FileImageIcon } from '@animateicons/react/lucide'

interface ImagePickerButtonProps {
  label: string
  accept: string
  multiple?: boolean
  // Máximo de imágenes cuando es múltiple; se muestra en el texto de ayuda.
  limit?: number
  // Cuando ya hay una imagen guardada y la nueva la reemplaza.
  replacesCurrent?: boolean
  disabled?: boolean
  onSelect: (files: File[]) => void
}

// "image/png,image/jpeg,image/svg+xml" -> "PNG, JPG, SVG"
function formatList(accept: string): string | null {
  if (accept.trim() === 'image/*') return null
  const names = accept
    .split(',')
    .map((type) => type.trim().split('/')[1] ?? '')
    .map((ext) => (ext === 'jpeg' ? 'jpg' : ext.replace('+xml', '')).toUpperCase())
    .filter(Boolean)
  return [...new Set(names)].join(', ')
}

function ImagePickerButton({
  label,
  accept,
  multiple = false,
  limit,
  replacesCurrent = false,
  disabled = false,
  onSelect,
}: Readonly<ImagePickerButtonProps>) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const formats = formatList(accept)
  const formatsText = formats ? t('common.imageHint.formats', { formats }) : t('common.imageHint.anyFormat')
  let ruleText = t('common.imageHint.single')
  if (multiple) ruleText = limit ? t('common.imageHint.upTo', { count: limit }) : t('common.imageHint.several')
  else if (replacesCurrent) ruleText = t('common.imageHint.replaces')

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          onSelect(Array.from(event.target.files ?? []))
          // Se limpia para que volver a elegir el mismo archivo dispare onChange.
          event.target.value = ''
        }}
        className="hidden"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 bg-white px-md py-sm font-body text-body-sm font-semibold text-heading transition-colors hover:border-green-500 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileImageIcon size={17} aria-hidden="true" />
        {label}
      </button>

      <p className="m-0 mt-xs font-body text-caption font-normal text-neutral-500">
        {formatsText} {ruleText}
      </p>
    </>
  )
}

export default ImagePickerButton
