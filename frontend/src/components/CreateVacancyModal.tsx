import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import TextField from './ui/TextField.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { validateRequired } from '../utils/validators.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { OptionalApplicationField, VacancyInput } from '../types/vacancy.ts'

interface CreateVacancyModalProps {
  onCreate: (data: VacancyInput) => Promise<void>
  onClose: () => void
}

const ALL_OPTIONAL_FIELDS: OptionalApplicationField[] = ['applicantPhone', 'file', 'certificates']

function CreateVacancyModal({ onCreate, onClose }: Readonly<CreateVacancyModalProps>) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredFields, setRequiredFields] = useState<OptionalApplicationField[]>(ALL_OPTIONAL_FIELDS)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggleField = (field: OptionalApplicationField) => {
    setRequiredFields((prev) =>
      prev.includes(field) ? prev.filter((current) => current !== field) : prev.concat(field),
    )
  }

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const handleSubmit = async () => {
    const titleErrorMessage = validateRequired(title, t('vacancies.formTitle'), t)
    const descriptionErrorMessage = validateRequired(description, t('vacancies.formDescription'), t)

    setTitleError(titleErrorMessage)
    setDescriptionError(descriptionErrorMessage)

    if (titleErrorMessage || descriptionErrorMessage) return

    setSaving(true)
    setSaveError(null)
    try {
      await onCreate({ title: title.trim(), description: description.trim(), requiredFields })
      onClose()
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('vacancies.publishModalTitle')}
      >
        <button
          type="button"
          className="absolute right-3 top-6.5 z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-[30px] font-bold leading-tight text-heading">
            {t('vacancies.publishModalTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-7 pb-8 pt-2.5 text-left">
          <TextField
            id="vacancy-title"
            label={t('vacancies.formTitle')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (titleError) setTitleError(null)
            }}
            error={titleError}
          />

          <div className="flex flex-col">
            <label htmlFor="vacancy-description" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('vacancies.formDescription')}
            </label>
            <textarea
              id="vacancy-description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descriptionError) setDescriptionError(null)
              }}
              className="w-full resize-none rounded-xl border border-neutral-300 bg-transparent p-sm font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500"
            />
            {descriptionError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{descriptionError}</p>
            )}
          </div>

          <fieldset>
            <legend className="mb-2xs font-body text-base font-normal leading-[1.6] text-body-text">
              {t('vacancies.formFieldsSectionTitle')}
            </legend>
            <p className="mb-sm font-body text-[13px] text-neutral-500">
              {t('vacancies.formFieldsSectionHint')}
            </p>

            <div className="flex flex-col gap-xs">
              <label className="flex cursor-pointer items-center gap-sm rounded-lg border border-neutral-200 px-md py-sm font-body text-[15px] text-body-text">
                <input
                  type="checkbox"
                  checked={requiredFields.includes('applicantPhone')}
                  onChange={() => toggleField('applicantPhone')}
                  className="size-4 accent-green-500"
                />
                {t('vacancies.applicantPhone')}
              </label>

              <label className="flex cursor-pointer items-center gap-sm rounded-lg border border-neutral-200 px-md py-sm font-body text-[15px] text-body-text">
                <input
                  type="checkbox"
                  checked={requiredFields.includes('file')}
                  onChange={() => toggleField('file')}
                  className="size-4 accent-green-500"
                />
                {t('vacancies.resumeLabel')}
              </label>

              <label className="flex cursor-pointer items-center gap-sm rounded-lg border border-neutral-200 px-md py-sm font-body text-[15px] text-body-text">
                <input
                  type="checkbox"
                  checked={requiredFields.includes('certificates')}
                  onChange={() => toggleField('certificates')}
                  className="size-4 accent-green-500"
                />
                {t('vacancies.certificates')}
              </label>
            </div>
          </fieldset>

          {saveError && <p className="text-left font-body text-sm text-danger">{saveError}</p>}

          <div className="mt-sm flex gap-md">
            <Button variant="secondary" onClick={onClose} className="h-11.75 flex-1 rounded-full font-body text-[17px] uppercase tracking-wide">
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              loading={saving}
              className="h-11.75 flex-1 rounded-full bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
            >
              {saving ? t('common.loading') : t('vacancies.publish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateVacancyModal
