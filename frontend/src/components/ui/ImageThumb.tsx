/** Miniatura de una imagen ya publicada o recién elegida en los formularios del admin */

import { useEffect, useRef, type ReactNode } from 'react'
import { Trash2Icon } from '@animateicons/react/lucide'

interface ImageThumbProps {
  // URL de una imagen ya publicada...
  src?: string
  // ...o el archivo recién elegido; la vista previa se genera y se libera sola.
  file?: File
  // Texto al lado de la miniatura: "Portada", "Galería", el nombre del archivo...
  label?: string
  onDelete?: () => void
  deleteLabel?: string
}

function ImageThumb({ src, file, label, onDelete, deleteLabel }: Readonly<ImageThumbProps>) {
  const imgRef = useRef<HTMLImageElement>(null)

  // El src del archivo se asigna directo al <img> para poder revocar la URL al cambiar o desmontar.
  useEffect(() => {
    if (!file || !imgRef.current) return
    const url = URL.createObjectURL(file)
    imgRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="flex items-center gap-sm rounded-xl border border-neutral-200 bg-white p-xs pr-sm">
      <img ref={imgRef} src={file ? undefined : src} alt="" className="size-16 shrink-0 rounded-lg bg-neutral-100 object-cover" />

      {label && <span className="max-w-[180px] truncate font-body text-caption font-normal text-neutral-500">{label}</span>}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-link"
        >
          <Trash2Icon size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

interface ImageThumbListProps {
  // Sin título se usa para las imágenes recién elegidas, justo debajo del botón "Elegir...".
  title?: string
  children: ReactNode
  className?: string
}

// Miniaturas en fila, con título opcional como "Imágenes actuales".
export function ImageThumbList({ title, children, className = 'mt-lg' }: Readonly<ImageThumbListProps>) {
  return (
    <div className={className}>
      {title && <h3 className="m-0 mb-sm font-body text-body-sm font-semibold text-heading">{title}</h3>}
      <div className="flex flex-wrap gap-md">{children}</div>
    </div>
  )
}

export default ImageThumb
