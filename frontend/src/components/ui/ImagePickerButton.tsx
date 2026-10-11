/** Botón para elegir imágenes en los formularios del admin (input file oculto) */

import { useRef } from 'react'
import { FileImageIcon } from '@animateicons/react/lucide'

interface ImagePickerButtonProps {
  label: string
  accept: string
  multiple?: boolean
  disabled?: boolean
  onSelect: (files: File[]) => void
}

function ImagePickerButton({ label, accept, multiple = false, disabled = false, onSelect }: Readonly<ImagePickerButtonProps>) {
  const inputRef = useRef<HTMLInputElement>(null)

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
    </>
  )
}

export default ImagePickerButton
