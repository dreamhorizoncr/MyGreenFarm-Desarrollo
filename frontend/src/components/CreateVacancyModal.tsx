import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
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
  const dialogRef = useRef<HTMLDialogElement>(null)

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

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

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

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-label={t('vacancies.publishModalTitle')}
      className="fixed inset-0 m-auto max-h-[90vh] w-[min(820px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg backdrop:bg-scrim animate-[modal-in_0.2s_ease-out] md:p-xl"
    >
      <div className="flex items-center justify-between gap-md">
        <h2 className="m-0 font-heading text-2xl font-bold text-heading">
          {t('vacancies.publishModalTitle')}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('admin.cancel')}
          className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
        >
          <XIcon size={20} />
        </button>
      </div>

      <div className="mt-lg grid gap-md">
        <label className="font-body text-body-sm font-semibold text-heading">
          {t('vacancies.formTitle')}
          <input
            id="vacancy-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (titleError) setTitleError(null)
            }}
            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
          />
          {titleError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{titleError}</span>
          )}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('vacancies.formDescription')}
          <textarea
            id="vacancy-description"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              if (descriptionError) setDescriptionError(null)
            }}
            className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
          />
          {descriptionError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{descriptionError}</span>
          )}
        </label>

        <fieldset>
          <legend className="mb-xs font-body text-body-sm font-semibold text-heading">
            {t('vacancies.formFieldsSectionTitle')}
          </legend>
          <p className="mb-sm font-body text-body-sm text-neutral-500">
            {t('vacancies.formFieldsSectionHint')}
          </p>

          <div className="flex flex-col gap-xs">
            <label className="flex cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm text-body-text">
              <input
                type="checkbox"
                checked={requiredFields.includes('applicantPhone')}
                onChange={() => toggleField('applicantPhone')}
                className="size-4 accent-green-500"
              />
              {t('vacancies.applicantPhone')}
            </label>

            <label className="flex cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm text-body-text">
              <input
                type="checkbox"
                checked={requiredFields.includes('file')}
                onChange={() => toggleField('file')}
                className="size-4 accent-green-500"
              />
              {t('vacancies.resumeLabel')}
            </label>

            <label className="flex cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm text-body-text">
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
      </div>

      {saveError && (
        <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">{saveError}</p>
      )}

      <div className="mt-lg flex flex-wrap justify-end gap-sm">
        <Button
          variant="secondary"
          onClick={onClose}
          className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
        >
          {t('admin.cancel')}
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          loading={saving}
          className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
        >
          {saving ? t('common.loading') : t('vacancies.publish')}
        </Button>
      </div>
    </dialog>
  )
}

export default CreateVacancyModal
