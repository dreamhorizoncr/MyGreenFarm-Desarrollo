import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button.tsx'
import Select from './ui/Select.tsx'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import type { OnvoRawPlan, ServicePlan } from '../types/servicePlan.ts'
import ImagePickerButton from './ui/ImagePickerButton.tsx'
import ImageThumb, { ImageThumbList } from './ui/ImageThumb.tsx'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import { servicePlanService } from '../services/servicePlan.ts'
import { notify, notifyError } from '../utils/notifications.ts'
import { validateSafeText } from '../utils/validators.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import ScheduleField from './ui/ScheduleField.tsx'
import { emptySchedule, parseSchedule, serializeSchedule, validateSchedule } from '../utils/schedule.ts'
import FieldHint from './ui/FieldHint.tsx'

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
  onSave: (data: { schedule: string; includes: string; gatewayPriceId: string; imageAlt?: string }, file: File) => Promise<unknown>
  onUpdate?: (id: string, data: { schedule: string; includes: string; gatewayPriceId: string; imageAlt?: string }, file?: File) => Promise<unknown>
  onClose: () => void
  onImageDeleted?: () => void | Promise<void>
}

function CreateServicePlanModal({ onvoPlans, existingPlans, planToEdit, onSave, onUpdate, onClose, onImageDeleted }: Readonly<CreateServicePlanModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)

  const isEditing = !!planToEdit

  const [gatewayPriceId, setGatewayPriceId] = useState(planToEdit?.gatewayPriceId ?? '')
  const [schedule, setSchedule] = useState(() => parseSchedule(planToEdit?.schedule) ?? emptySchedule())
  const [includes, setIncludes] = useState(planToEdit?.includes ?? '')
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(planToEdit?.imageUrl ?? null)
  const [confirmImageDelete, setConfirmImageDelete] = useState(false)

  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [includesError, setIncludesError] = useState<string | null>(null)
  const [onvoError, setOnvoError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState(planToEdit?.imageAlt ?? '')
  const [imageAltError, setImageAltError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    return () => {
      if (selectedImage) releasePreview(selectedImage)
    }
  }, [selectedImage])

  const availablePlans = isEditing
    ? onvoPlans
    : onvoPlans.filter(sp => !existingPlans.some(p => p.gatewayPriceId === sp.gatewayPriceId))

  const handleFileChange = (file: File | undefined) => {
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError(t('admin.servicios.invalidFileType', { name: file.name }))
      return
    }

    if (selectedImage) releasePreview(selectedImage)
    setSelectedImage({ file, previewUrl: URL.createObjectURL(file) })
    setImageError(null)
  }

  const validateImageAlt = () => {
    const altValue = imageAlt.trim()
    let altMessage: string | null = null
    if (altValue) altMessage = validateSafeText(altValue, t)
    else if (selectedImage) altMessage = t('common.imageAltRequired')
    setImageAltError(altMessage)
    return !altMessage
  }

  const validateForm = () => {
    let hasError = false

    if (!gatewayPriceId) {
      setOnvoError(t('validation.fieldRequired', { field: t('admin.servicios.selectPlan') }))
      hasError = true
    } else {
      setOnvoError(null)
    }

    const scheduleMessage = validateSchedule(schedule, t)
    setScheduleError(scheduleMessage)
    if (scheduleMessage) hasError = true

    const includesMessage = includes.trim()
      ? validateSafeText(includes, t)
      : t('validation.fieldRequired', { field: t('admin.servicios.includesLabel') })
    setIncludesError(includesMessage)
    if (includesMessage) hasError = true

    if (!isEditing && !selectedImage) {
      setImageError(t('validation.fieldRequired', { field: t('admin.servicios.chooseImage') }))
      hasError = true
    } else {
      setImageError(null)
    }

    if (!validateImageAlt()) hasError = true

    return !hasError
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const data = { schedule: serializeSchedule(schedule), includes: includes.trim(), gatewayPriceId, imageAlt: imageAlt.trim() }
      if (isEditing && onUpdate) {
        await onUpdate(planToEdit.id, data, selectedImage?.file)
      } else {
        await onSave(data, selectedImage!.file)
      }
      requestClose()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const idleSubmitLabel = isEditing ? t('admin.save') : t('admin.servicios.create')

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      aria-label={isEditing ? t('admin.servicios.editPlan') : t('admin.servicios.newPlan')}
      className={`text-left fixed inset-0 m-auto max-h-[90vh] w-[min(820px,92vw)] max-w-none modal-scroll rounded-[20px] border border-neutral-200 bg-white p-lg backdrop:bg-scrim md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="flex items-center justify-between gap-md">
        <h2 className="m-0 font-heading text-h4 font-bold text-heading">
          {isEditing ? t('admin.servicios.editPlan') : t('admin.servicios.newPlan')}
        </h2>

        <ModalCloseButton
          onClick={requestClose}
          aria-label={t('admin.cancel')}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-lg grid gap-md">
        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.servicios.selectPlan')}
          <div className="mt-xs">
            <Select
              id="create-plan-onvo"
              value={gatewayPriceId}
              onChange={(value) => {
                setGatewayPriceId(value)
                if (onvoError) setOnvoError(null)
              }}
              disabled={isEditing}
              placeholder={t('admin.servicios.selectPlan')}
              options={availablePlans.map(plan => ({
                value: plan.gatewayPriceId,
                label: `${plan.name} — ${plan.price}`,
              }))}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
              aria-label={t('admin.servicios.selectPlan')}
            />
            <FieldHint>{t('fields.plan.onvo.hint')}</FieldHint>
          </div>
          {availablePlans.length === 0 && !isEditing && (
            <span className="mt-xs block font-body text-caption font-normal text-neutral-500">
              {t('admin.servicios.noOnvoPlans')}
            </span>
          )}
          {onvoError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{onvoError}</span>
          )}
        </label>

        <div>
          <ScheduleField
            id="create-plan-schedule"
            label={t('admin.servicios.scheduleLabel')}
            value={schedule}
            onChange={(value) => {
              setSchedule(value)
              if (scheduleError) setScheduleError(null)
            }}
            error={scheduleError}
          />
          <FieldHint>{t('fields.plan.schedule.hint')}</FieldHint>
        </div>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.servicios.includesLabel')}
          <textarea
            id="create-plan-includes"
            maxLength={800}
            value={includes}
            onChange={(e) => {
              setIncludes(e.target.value)
              if (includesError) setIncludesError(null)
            }}
            placeholder={t('fields.plan.includes.placeholder')}
            rows={3}
            className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
          />
          <FieldHint>{t('fields.plan.includes.hint')}</FieldHint>
          {includesError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{includesError}</span>
          )}
        </label>

        <div className="font-body text-body-sm font-semibold text-heading">
          <span className="block">{t('admin.servicios.image')}</span>
          <ImagePickerButton
            label={t('admin.servicios.chooseImage')}
            replacesCurrent={Boolean(currentImageUrl)}
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onSelect={(files) => handleFileChange(files[0])}
          />
          {selectedImage && (
            <ImageThumbList className="mt-sm">
              <ImageThumb
                src={selectedImage.previewUrl}
                label={selectedImage.file.name}
                onDelete={() => {
                  releasePreview(selectedImage)
                  setSelectedImage(null)
                }}
                deleteLabel={t('admin.cancel')}
                altText={imageAlt}
                onAltChange={(value) => {
                  setImageAlt(value)
                  if (imageAltError) setImageAltError(null)
                }}
                altError={imageAltError}
                altLabel={t('common.imageAltLabel')}
                altPlaceholder={t('common.imageAltPlaceholder')}
              />
            </ImageThumbList>
          )}
          {!selectedImage && isEditing && currentImageUrl && (
            <ImageThumbList title={t('admin.servicios.currentImage')} className="mt-sm">
              <ImageThumb
                src={currentImageUrl}
                label={t('admin.servicios.image')}
                onDelete={() => setConfirmImageDelete(true)}
                deleteLabel={t('common.deleteImageTitle')}
                altText={imageAlt}
                onAltChange={(value) => {
                  setImageAlt(value)
                  if (imageAltError) setImageAltError(null)
                }}
                altError={imageAltError}
                altLabel={t('common.imageAltLabel')}
                altPlaceholder={t('common.imageAltPlaceholder')}
              />
            </ImageThumbList>
          )}
          {imageError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{imageError}</span>
          )}
        </div>

        <div className="mt-sm flex justify-end gap-md *:flex-1">
          <Button
            variant="secondary"
            type="button"
            onClick={requestClose}
            className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
          >
            {t('admin.cancel')}
          </Button>
          <Button
            variant="success"
            type="submit"
            loading={saving}
            disabled={!gatewayPriceId || !includes.trim() || !schedule.every((block) => block.days.length > 0 && block.start && block.end) || (!isEditing && !selectedImage)}
            className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
          >
            {saving ? t('common.loading') : idleSubmitLabel}
          </Button>
        </div>
      </form>

      {confirmImageDelete && planToEdit && (
        <DeleteConfirmModal
          title={t('common.deleteImageTitle')}
          message={t('common.deleteImageMessage')}
          onConfirm={async () => {
            try {
              await servicePlanService.deleteImage(planToEdit.id)
            } catch (err) {
              notifyError(t('common.imageDeleteErrorToast'), err)
              throw err
            }
            setCurrentImageUrl(null)
            notify.success(t('common.imageDeletedToast'))
            await onImageDeleted?.()
          }}
          onClose={() => setConfirmImageDelete(false)}
        />
      )}
    </dialog>
  )
}

export default CreateServicePlanModal
