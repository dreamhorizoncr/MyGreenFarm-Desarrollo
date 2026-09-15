import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudUploadIcon, XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import TextField from './ui/TextField.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { useVacancyApplicationForm } from '../hooks/useVacancyApplicationForm.ts'
import type { Vacancy } from '../types/vacancy.ts'
import type { ApplicationInput } from '../types/curriculum.ts'

interface ApplyVacancyModalProps {
  vacancy: Vacancy
  onSubmit: (data: ApplicationInput) => Promise<void>
  onClose: () => void
}

function ApplyVacancyModal({ vacancy, onSubmit, onClose }: ApplyVacancyModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const certificatesInputRef = useRef<HTMLInputElement>(null)

  const form = useVacancyApplicationForm(vacancy.id, onSubmit)

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const handleSubmitClick = async () => {
    const succeeded = await form.handleSubmit()
    if (succeeded) onClose()
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
        aria-label={t('vacancies.applyModalTitle')}
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
            {t('vacancies.applyModalTitle')}
          </h2>
          <p className="m-0 mt-2xs font-body text-[15px] text-neutral-500">{vacancy.title}</p>
        </div>

        <div className="flex flex-col gap-md px-7 pb-8 pt-2.5 text-left">
          <TextField
            id="apply-name"
            label={t('vacancies.applicantName')}
            value={form.name}
            onChange={(e) => form.handleNameChange(e.target.value)}
            error={form.nameError}
          />

          <TextField
            id="apply-email"
            type="email"
            label={t('vacancies.applicantEmail')}
            value={form.email}
            onChange={(e) => form.handleEmailChange(e.target.value)}
            error={form.emailError}
          />

          <TextField
            id="apply-phone"
            type="tel"
            label={t('vacancies.applicantPhone')}
            value={form.phone}
            onChange={(e) => form.handlePhoneChange(e.target.value)}
            error={form.phoneError}
          />

          <div className="flex flex-col">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => form.handleFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
              id="apply-file-input"
            />

            <p className="mb-2xs font-body text-[15px] font-semibold text-body-text">
              {t('vacancies.resumeLabel')}
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-fit items-center gap-sm whitespace-nowrap rounded-full border border-neutral-200 bg-white px-md font-body text-[15px] font-semibold text-body-text hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
            >
              <CloudUploadIcon size={18} aria-hidden="true" />
              <span>{t('vacancies.chooseFile')}</span>
            </button>

            <p className="mt-2xs font-body text-[13px] text-neutral-500">
              {form.file ? form.file.name : t('vacancies.noFileChosen')}
            </p>

            {form.fileError && <p className="mt-2xs text-left font-body text-sm text-danger">{form.fileError}</p>}
          </div>

          <div className="flex flex-col">
            <input
              ref={certificatesInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              multiple
              onChange={(e) => form.handleCertificatesChange(e.target.files)}
              className="hidden"
              id="apply-certificates-input"
            />

            <p className="mb-2xs font-body text-[15px] font-semibold text-body-text">
              {t('vacancies.certificates')}
            </p>
            <p className="mb-xs font-body text-[13px] text-neutral-500">
              {t('vacancies.certificatesHint')}
            </p>

            <button
              type="button"
              onClick={() => certificatesInputRef.current?.click()}
              className="flex h-11 w-fit items-center gap-sm whitespace-nowrap rounded-full border border-neutral-200 bg-white px-md font-body text-[15px] font-semibold text-body-text hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
            >
              <CloudUploadIcon size={18} aria-hidden="true" />
              <span>{t('vacancies.chooseCertificates')}</span>
            </button>

            {form.certificates.length === 0 ? (
              <p className="mt-2xs font-body text-[13px] text-neutral-500">
                {t('vacancies.noCertificatesChosen')}
              </p>
            ) : (
              <ul className="mt-xs flex flex-col gap-2xs">
                {form.certificates.map((certificateFile, index) => (
                  <li
                    key={`${certificateFile.name}-${index}`}
                    className="flex items-center justify-between gap-sm rounded-lg border border-neutral-200 bg-white px-sm py-2xs"
                  >
                    <span className="min-w-0 truncate font-body text-[13px] text-body-text">
                      {certificateFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => form.handleRemoveCertificate(index)}
                      aria-label={t('vacancies.removeCertificate')}
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-transparent text-neutral-400 transition-colors hover:bg-(--grey-100) hover:text-danger focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                    >
                      <XIcon size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {form.certificatesError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{form.certificatesError}</p>
            )}
          </div>

          {form.submitError && <p className="text-left font-body text-sm text-danger">{form.submitError}</p>}

          <div className="mt-sm flex gap-md">
            <Button variant="secondary" onClick={onClose} className="h-11.75 flex-1 rounded-full font-body text-[17px] uppercase tracking-wide">
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSubmitClick}
              loading={form.submitting}
              className="h-11.75 flex-1 rounded-full bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
            >
              {form.submitting ? t('common.loading') : t('vacancies.submitApplication')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplyVacancyModal
