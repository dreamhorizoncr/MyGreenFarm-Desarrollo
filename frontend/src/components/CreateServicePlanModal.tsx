import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileImageIcon, XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import type { OnvoRawPlan, ServicePlan } from '../types/servicePlan.ts'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']

interface SelectedImage {
  file: File
  previewUrl: string
}

function releasePreview(image: SelectedImage | null) {
  if (image) URL.revokeObjectURL(image.previewUrl)
}

interface CreateServicePlanModalProps {
  onvoPlans: OnvoRawPlan[]
  existingPlans: ServicePlan[]
  planToEdit?: ServicePlan | null
  onSave: (data: { schedule: string; includes: string; gatewayPriceId: string }, file: File) => Promise<unknown>
  onUpdate?: (id: string, data: { schedule: string; includes: string; gatewayPriceId: string }, file?: File) => Promise<unknown>
  onClose: () => void
}

function CreateServicePlanModal({ onvoPlans, existingPlans, planToEdit, onSave, onUpdate, onClose }: CreateServicePlanModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!planToEdit

  const [gatewayPriceId, setGatewayPriceId] = useState(planToEdit?.gatewayPriceId ?? '')
  const [schedule, setSchedule] = useState(planToEdit?.schedule ?? '')
  const [includes, setIncludes] = useState(planToEdit?.includes ?? '')
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [saving, setSaving] = useState(false)

  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [includesError, setIncludesError] = useState<string | null>(null)
  const [onvoError, setOnvoError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  useDismiss({ ref: overlayRef, isOpen: true, onClose, includeClickOutside: false })

  useEffect(() => {
    return () => {
      if (selectedImage) releasePreview(selectedImage)
    }
  }, [selectedImage])

  const availablePlans = isEditing
    ? onvoPlans
    : onvoPlans.filter(sp => !existingPlans.some(p => p.gatewayPriceId === sp.gatewayPriceId))

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError(t('admin.servicios.invalidFileType', { name: file.name }))
      return
    }

    if (selectedImage) releasePreview(selectedImage)
    setSelectedImage({ file, previewUrl: URL.createObjectURL(file) })
    setImageError(null)
    event.target.value = ''
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    let hasError = false

    if (!gatewayPriceId) {
      setOnvoError(t('validation.fieldRequired', { field: t('admin.servicios.selectPlan') }))
      hasError = true
    } else {
      setOnvoError(null)
    }

    if (!schedule.trim()) {
      setScheduleError(t('validation.fieldRequired', { field: t('admin.servicios.scheduleLabel') }))
      hasError = true
    } else {
      setScheduleError(null)
    }

    if (!includes.trim()) {
      setIncludesError(t('validation.fieldRequired', { field: t('admin.servicios.includesLabel') }))
      hasError = true
    } else {
      setIncludesError(null)
    }

    if (!isEditing && !selectedImage) {
      setImageError(t('validation.fieldRequired', { field: t('admin.servicios.chooseImage') }))
      hasError = true
    } else {
      setImageError(null)
    }

    if (hasError) return

    setSaving(true)
    try {
      const data = { schedule: schedule.trim(), includes: includes.trim(), gatewayPriceId }
      if (isEditing && onUpdate) {
        await onUpdate(planToEdit.id, data, selectedImage?.file)
      } else {
        await onSave(data, selectedImage!.file)
      }
      onClose()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto scrollbar-none rounded-2xl bg-bg-card animate-[modal-in_0.2s_ease-out] ${
          isEditing ? 'p-[20px_18px_22px]' : 'p-[28px_22px_30px]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? t('admin.servicios.editPlan') : t('admin.servicios.newPlan')}
      >
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className={`${isEditing ? 'mb-md' : 'mb-lg'} relative text-center`}>
          <h2 className={`m-0 font-heading font-bold leading-none text-heading ${isEditing ? 'text-[32px]' : 'text-[42px]'}`}>
            {isEditing ? t('admin.servicios.editPlan') : t('admin.servicios.newPlan')}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`flex flex-col text-left ${
            isEditing ? 'gap-sm px-[18px] pb-[18px] pt-[18px]' : 'gap-md px-[28px] pb-[32px] pt-[30px]'
          }`}
        >
          <div className="flex flex-col">
            <label htmlFor="create-plan-onvo" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.servicios.selectPlan')}
            </label>
            <select
              id="create-plan-onvo"
              value={gatewayPriceId}
              onChange={(e) => {
                setGatewayPriceId(e.target.value)
                if (onvoError) setOnvoError(null)
              }}
              disabled={isEditing}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 disabled:opacity-50"
            >
              <option value="">{t('admin.servicios.selectPlan')}</option>
              {availablePlans.map(plan => (
                <option key={plan.gatewayPriceId} value={plan.gatewayPriceId}>
                  {plan.name} — {plan.price}
                </option>
              ))}
            </select>
            {availablePlans.length === 0 && !isEditing && (
              <p className="mt-2xs text-left font-body text-[13px] text-neutral-500">
                {t('admin.servicios.noOnvoPlans')}
              </p>
            )}
            {onvoError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{onvoError}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="create-plan-schedule" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.servicios.scheduleLabel')}
            </label>
            <input
              id="create-plan-schedule"
              type="text"
              maxLength={200}
              value={schedule}
              onChange={(e) => {
                setSchedule(e.target.value)
                if (scheduleError) setScheduleError(null)
              }}
              placeholder={t('admin.servicios.schedulePlaceholder')}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400"
            />
            {scheduleError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{scheduleError}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="create-plan-includes" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.servicios.includesLabel')}
            </label>
            <textarea
              id="create-plan-includes"
              maxLength={800}
              value={includes}
              onChange={(e) => {
                setIncludes(e.target.value)
                if (includesError) setIncludesError(null)
              }}
              placeholder={t('admin.servicios.includesPlaceholder')}
              rows={3}
              className="w-full resize-none border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400"
            />
            {includesError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{includesError}</p>
            )}
          </div>

          <div className="flex flex-col">
            <span className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.servicios.chooseImage')}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[44px] items-center justify-center gap-sm rounded-xl border border-dashed border-neutral-300 bg-neutral-50 font-body text-sm text-body-text-dark transition-colors hover:border-green-500 hover:bg-green-50"
            >
              <FileImageIcon size={18} />
              {selectedImage ? selectedImage.file.name : t('admin.servicios.chooseImage')}
            </button>
            {selectedImage && (
              <div className="relative mt-2 inline-block w-[120px]">
                <img
                  src={selectedImage.previewUrl}
                  alt={t('admin.servicios.currentImage')}
                  className="h-[80px] w-[120px] rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    releasePreview(selectedImage)
                    setSelectedImage(null)
                  }}
                  className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-danger text-white"
                  aria-label={t('admin.cancel')}
                >
                  <XIcon size={12} />
                </button>
              </div>
            )}
            {!selectedImage && isEditing && planToEdit?.imageUrl && (
              <div className="relative mt-2 inline-block w-[120px]">
                <img
                  src={planToEdit.imageUrl}
                  alt={t('admin.servicios.currentImage')}
                  className="h-[80px] w-[120px] rounded-lg object-cover"
                />
                <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 font-body text-[10px] text-white">
                  {t('admin.servicios.currentImage')}
                </span>
              </div>
            )}
            {imageError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{imageError}</p>
            )}
          </div>

          <div className="flex gap-md mt-sm">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="h-[47px] flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
            >
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              type="submit"
              loading={saving}
              className="h-[47px] flex-1 rounded-full bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
            >
              {saving ? t('common.loading') : isEditing ? t('admin.save') : t('admin.servicios.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateServicePlanModal
