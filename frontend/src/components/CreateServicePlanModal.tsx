import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import Button from './ui/Button.tsx'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import type { CabysItem, ServicePlan, ServicePlanRequest } from '../types/servicePlan.ts'
import type { Currency } from '../types/exchangeRate.ts'
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
import { useMenuPosition } from '../hooks/useMenuPosition.ts'
import { useDropdownMotion } from '../hooks/useDropdownMotion.ts'
import Select, { type SelectOption } from './ui/Select.tsx'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']
const CABYS_MENU_MAX_HEIGHT = 240
const CABYS_OPTION_HEIGHT = 56
const CABYS_MENU_PADDING = 8

interface SelectedImage {
  file: File
  previewUrl: string
}

function releasePreview(image: SelectedImage | null) {
  if (image) URL.revokeObjectURL(image.previewUrl)
}

function cabysLabel(item: CabysItem) {
  return `${item.codigo} — ${item.descripcion}`
}

interface CreateServicePlanModalProps {
  planToEdit?: ServicePlan | null
  onSave: (data: ServicePlanRequest, file: File) => Promise<unknown>
  onUpdate?: (id: string, data: ServicePlanRequest, file?: File) => Promise<unknown>
  onClose: () => void
  onImageDeleted?: () => void | Promise<void>
}

function CreateServicePlanModal({ planToEdit, onSave, onUpdate, onClose, onImageDeleted }: Readonly<CreateServicePlanModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cabysInputRef = useRef<HTMLInputElement>(null)
  const cabysMenuRef = useRef<HTMLUListElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)

  const isEditing = !!planToEdit

  const [gatewayPriceId] = useState(planToEdit?.gatewayPriceId ?? '')
  const [name, setName] = useState(planToEdit?.name ?? '')
  const [description, setDescription] = useState(planToEdit?.description ?? '')
  const [price, setPrice] = useState(planToEdit?.price?.toString() ?? '')
  const [type, setType] = useState(planToEdit?.type ?? 'ONE_TIME')
  const [currency, setCurrency] = useState(planToEdit?.currency ?? 'CRC')
  const [cabysQuery, setCabysQuery] = useState(planToEdit?.cabysCode ?? '')
  const [selectedCabys, setSelectedCabys] = useState<CabysItem | null>(null)
  const [cabysResults, setCabysResults] = useState<CabysItem[]>([])
  const [searchingCabys, setSearchingCabys] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState<'percent_off' | 'amount_off'>('percent_off')
  const [couponValue, setCouponValue] = useState('')
  const [couponExpiresAt, setCouponExpiresAt] = useState('')
  const [couponMaxRedemptions, setCouponMaxRedemptions] = useState('')
  const [schedule, setSchedule] = useState(() => parseSchedule(planToEdit?.schedule) ?? emptySchedule())
  const [includes, setIncludes] = useState(planToEdit?.includes ?? '')
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(planToEdit?.imageUrl ?? null)
  const [confirmImageDelete, setConfirmImageDelete] = useState(false)

  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [includesError, setIncludesError] = useState<string | null>(null)
  const [cabysError, setCabysError] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState(planToEdit?.imageAlt ?? '')
  const [imageAltError, setImageAltError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const cabysMenuOpen = cabysResults.length > 0
  const cabysMenuPosition = useMenuPosition({
    triggerRef: cabysInputRef,
    open: cabysMenuOpen,
    desiredHeight: Math.min(CABYS_MENU_MAX_HEIGHT, cabysResults.length * CABYS_OPTION_HEIGHT + CABYS_MENU_PADDING),
    maxHeight: CABYS_MENU_MAX_HEIGHT,
  })
  const cabysDropdownMotion = useDropdownMotion(cabysMenuPosition?.bottom !== undefined)

  const billingTypeOptions: SelectOption[] = [
    { value: 'ONE_TIME', label: t('admin.servicios.oneTime') },
    { value: 'DAILY', label: t('admin.servicios.daily') },
    { value: 'WEEKLY', label: t('admin.servicios.weekly') },
    { value: 'TWO_WEEKS', label: t('admin.servicios.twoWeeks') },
    { value: 'MONTHLY', label: t('admin.servicios.monthly') },
    { value: 'SIX_MONTHS', label: t('admin.servicios.sixMonths') },
    { value: 'ANNUAL', label: t('admin.servicios.annual') },
  ]

  const currencyOptions: SelectOption[] = [
    { value: 'CRC', label: 'CRC' },
    { value: 'USD', label: 'USD' },
  ]

  useEffect(() => {
    return () => {
      if (selectedImage) releasePreview(selectedImage)
    }
  }, [selectedImage])

  useEffect(() => {
    if (cabysQuery.trim().length < 3
      || (planToEdit?.cabysCode === cabysQuery.trim() && !selectedCabys)
      || (selectedCabys && cabysLabel(selectedCabys) === cabysQuery)) {
      setCabysResults([])
      return
    }
    let isCurrent = true
    const timeout = window.setTimeout(() => {
      setSearchingCabys(true)
      void servicePlanService.searchCabys(cabysQuery.trim())
        .then((response: any) => {
          if (!isCurrent) return
          console.log("RESPUESTA RECIBIDA EN EL FRONTEND:", response);
          // Extraemos correctamente el arreglo de la propiedad 'items' devuelta por el backend
          const items: CabysItem[] = response?.items ?? (Array.isArray(response) ? response : [])
          
          const exactMatch = items.find((item) => item.codigo === cabysQuery.trim())
          if (exactMatch) {
            setSelectedCabys(exactMatch)
            setCabysQuery(cabysLabel(exactMatch))
            setCabysResults([])
            return
          }
          setCabysResults(items)
        })
        .catch((error: unknown) => {
          if (!isCurrent) return
          setCabysError(t('admin.servicios.cabysSearchError'))
          notifyError(t('admin.servicios.cabysSearchError'), error)
        })
        .finally(() => {
          if (isCurrent) setSearchingCabys(false)
        })
    }, 350)
    return () => {
      isCurrent = false
      window.clearTimeout(timeout)
    }
  }, [cabysQuery, selectedCabys, t])

  useEffect(() => {
    if (!cabysMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (cabysInputRef.current?.contains(target) || cabysMenuRef.current?.contains(target)) return
      setCabysResults([])
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCabysResults([])
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [cabysMenuOpen])

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

    if (!isEditing && (!name.trim() || !description.trim() || !price || Number(price) <= 0)) {
      setCabysError(t('admin.servicios.serviceFieldsRequired'))
      hasError = true
    } else if (!selectedCabys && !planToEdit?.cabysCode) {
      setCabysError(t('admin.servicios.selectCabys'))
      hasError = true
    } else {
      setCabysError(null)
    }

    if (couponCode.trim() && (!couponValue || Number(couponValue) <= 0
      || (couponType === 'percent_off' && Number(couponValue) > 100)
      || (couponType === 'amount_off' && Number(couponValue) >= Number(price)))) {
      setCouponError(t('admin.servicios.invalidCoupon'))
      hasError = true
    } else {
      setCouponError(null)
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
      const data: ServicePlanRequest = {
        schedule: serializeSchedule(schedule),
        includes: includes.trim(),
        gatewayPriceId,
        imageAlt: imageAlt.trim(),
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        type,
        currency,
        cabysCode: selectedCabys?.codigo ?? planToEdit?.cabysCode,
        taxRate: selectedCabys?.impuesto ?? planToEdit?.taxRate,
        ...(couponCode.trim() ? {
          couponCode: couponCode.trim().toUpperCase(),
          couponType,
          couponValue: Number(couponValue),
          ...(couponExpiresAt ? { couponExpiresAt } : {}),
          ...(couponMaxRedemptions ? { couponMaxRedemptions: Number(couponMaxRedemptions) } : {}),
        } : {}),
      }
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
        {!isEditing && (
          <>
            <label className="font-body text-body-sm font-semibold text-heading">
              {t('admin.servicios.name')}
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120}
                className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
            </label>
            <label className="font-body text-body-sm font-semibold text-heading">
              {t('admin.servicios.description')}
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={500}
                rows={3} className="mt-xs w-full rounded-xl border border-neutral-200 p-md font-normal" />
            </label>
            <div className="grid gap-md sm:grid-cols-3">
              <label className="font-body text-body-sm font-semibold text-heading">
                {t('admin.servicios.price')}
                <input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required
                  className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
              </label>
              <label className="font-body text-body-sm font-semibold text-heading">
                {t('admin.servicios.currency')}
                <Select
                  id="service-currency"
                  value={currency}
                  onChange={(val) => setCurrency(val as Currency)}
                  placeholder="Seleccione moneda..."
                  options={currencyOptions}
                  className="w-full rounded-xl border border-neutral-200 h-11 bg-white px-md mt-xs"
                />
              </label>
              <label className="font-body text-body-sm font-semibold text-heading">
                {t('admin.servicios.billingType')}
                <Select
                  id="service-billing-type"
                  value={type}
                  onChange={(val) => setType(val)}
                  placeholder={(t('admin.servicios.selectBillingType' as any) || 'Seleccione el tipo de cobro') as string}
                  options={billingTypeOptions}
                  className="w-full rounded-xl border border-neutral-200 h-11 bg-white px-md mt-xs"
                />
              </label>
            </div>
          </>
        )}
        <div className="font-body text-body-sm font-semibold text-heading">
          {t('admin.servicios.cabys')}
          <input
            ref={cabysInputRef}
            value={cabysQuery}
            onChange={(event) => {
              setCabysQuery(event.target.value)
              setSelectedCabys(null)
              setCabysResults([])
              setCabysError(null)
            }}
            aria-autocomplete="list"
            aria-expanded={cabysMenuOpen}
            aria-controls="cabys-results-menu"
            placeholder={t('admin.servicios.cabysPlaceholder')}
            className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal"
          />
          {searchingCabys && <span className="mt-xs block font-normal text-neutral-500">{t('common.loading')}</span>}
          {selectedCabys && (
            <span className="mt-xs block font-normal text-green-700">
              {cabysLabel(selectedCabys)} · {t('admin.servicios.selectedTax')}: {selectedCabys.impuesto}% 
            </span>
          )}
          {cabysError && <span className="mt-xs block font-normal text-danger">{cabysError}</span>}
        </div>
        <AnimatePresence>
          {cabysMenuOpen && cabysMenuPosition && (
            <motion.ul
              {...cabysDropdownMotion}
              ref={cabysMenuRef}
              id="cabys-results-menu"
              style={{
                top: cabysMenuPosition.top,
                bottom: cabysMenuPosition.bottom,
                left: cabysMenuPosition.left,
                width: cabysMenuPosition.width,
                maxHeight: cabysMenuPosition.maxHeight,
              }}
              className="fixed z-[10000] m-0 list-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-xs shadow-lg"
              role="listbox"
            >
              {cabysResults.map((item) => (
                <li key={item.codigo} role="none">
                  <button
                    type="button"
                    role="option"
                    onClick={() => {
                      setSelectedCabys(item)
                      setCabysQuery(cabysLabel(item))
                      setCabysResults([])
                      setCabysError(null)
                    }}
                    className="w-full rounded-lg px-sm py-sm text-left font-body text-body-sm font-normal hover:bg-green-50"
                  >
                    <span className="block font-semibold text-heading">{item.codigo}</span>
                    <span className="block text-neutral-600">
                      {item.descripcion} ({item.impuesto}%)
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <fieldset className="grid gap-sm rounded-xl border border-neutral-200 p-md">
          <legend className="px-xs font-body text-body-sm font-semibold text-heading">{t('admin.servicios.coupon')}</legend>
          <label className="font-body text-body-sm font-semibold text-heading">
            {t('admin.servicios.couponCode')}
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} maxLength={60}
              className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
          </label>
          {couponCode.trim() && (
            <>
              <div className="grid gap-sm sm:grid-cols-2">
                <label className="font-body text-body-sm font-semibold text-heading">
                  {t('admin.servicios.discountType')}
                  <select value={couponType} onChange={(event) => setCouponType(event.target.value as 'percent_off' | 'amount_off')}
                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal">
                    <option value="percent_off">{t('admin.servicios.percentage')}</option>
                    <option value="amount_off">{t('admin.servicios.fixedAmount')}</option>
                  </select>
                </label>
                <label className="font-body text-body-sm font-semibold text-heading">
                  {t('admin.servicios.discountValue')}
                  <input type="number" min="0.01" step="0.01" value={couponValue} onChange={(event) => setCouponValue(event.target.value)} required
                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
                </label>
              </div>
              <div className="grid gap-sm sm:grid-cols-2">
                <label className="font-body text-body-sm font-semibold text-heading">
                  {t('admin.servicios.couponExpiry')}
                  <input type="date" value={couponExpiresAt} onChange={(event) => setCouponExpiresAt(event.target.value)}
                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
                </label>
                <label className="font-body text-body-sm font-semibold text-heading">
                  {t('admin.servicios.couponMaxUses')}
                  <input type="number" min="1" step="1" value={couponMaxRedemptions} onChange={(event) => setCouponMaxRedemptions(event.target.value)}
                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-normal" />
                </label>
              </div>
            </>
          )}
          {couponError && <span className="font-body text-body-sm font-normal text-danger">{couponError}</span>}
        </fieldset>

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
                label={t('common.imageCover')}
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
            disabled={!includes.trim() || !schedule.every((block) => block.days.length > 0 && block.start && block.end) || (!isEditing && !selectedImage)}
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