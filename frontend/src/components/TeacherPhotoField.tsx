import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRoundIcon } from '@animateicons/react/lucide'
import FieldHint from './ui/FieldHint.tsx'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

interface TeacherPhotoFieldProps {
  currentUrl?: string | null
  file: File | null
  removed: boolean
  disabled?: boolean
  onFileChange: (file: File | null) => void
  onRemovedChange: (removed: boolean) => void
  className?: string
}

function TeacherPhotoField({ currentUrl, file, removed, disabled, onFileChange, onRemovedChange, className = '' }: Readonly<TeacherPhotoFieldProps>) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const shownUrl = preview ?? (removed ? null : currentUrl ?? null)

  const handleSelect = (selected?: File) => {
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      setError(t('admin.teachers.invalidPhoto'))
      return
    }
    if (selected.size > MAX_PHOTO_BYTES) {
      setError(t('admin.teachers.photoTooLarge'))
      return
    }
    setError(null)
    onRemovedChange(false)
    onFileChange(selected)
  }

  const handleRemove = () => {
    onFileChange(null)
    onRemovedChange(true)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={`font-body text-body-sm font-semibold text-heading ${className}`}>
      {t('admin.teachers.photoLabel')}
      <div className="mt-xs flex items-center gap-md">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-green-100 bg-green-50">
          {shownUrl ? (
            <img src={shownUrl} alt={t('admin.teachers.photoAlt')} className="h-full w-full object-cover" />
          ) : (
            <UserRoundIcon size={28} className="text-green-500" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleSelect(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-sm">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-green-500 px-md py-xs font-body text-body-sm font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50"
          >
            {shownUrl ? t('admin.teachers.changePhoto') : t('admin.teachers.addPhoto')}
          </button>
          {shownUrl && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleRemove}
              className="rounded-full border border-red-300 px-md py-xs font-body text-body-sm font-semibold text-danger transition hover:bg-red-50 disabled:opacity-50"
            >
              {t('admin.teachers.deletePhoto')}
            </button>
          )}
        </div>
      </div>
      <FieldHint>{t('admin.teachers.photoHint')}</FieldHint>
      {error && <span className="mt-xs block font-body text-body-sm font-normal text-danger">{error}</span>}
    </div>
  )
}

export default TeacherPhotoField
