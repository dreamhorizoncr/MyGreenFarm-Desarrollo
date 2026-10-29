import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, StarIcon } from '@animateicons/react/lucide'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import TabHighlight from '../components/ui/TabHighlight.tsx'
import { tabCarouselClass, useTabCarousel } from '../hooks/useTabCarousel.ts'
import AdminLayout from '../layout/AdminLayout.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import DeleteAlbumModal from '../components/DeleteAlbumModal.tsx'
import DeleteYearModal from '../components/DeleteYearModal.tsx'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import { useGalleryAdmin } from '../hooks/useGalleryAdmin.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { notify, notifyError } from '../utils/notifications.ts'
import { validateMinLength, validateRequired, validateSafeText } from '../utils/validators.ts'
import type { Gallery, GalleryCategory, GalleryImage, GalleryRequest } from '../types/gallery.ts'
import ninos2 from '../assets/imgs/ninos2.svg'
import CardActionButton from '../components/ui/CardActionButton.tsx'
import CheckboxField from '../components/ui/CheckboxField.tsx'
import ImagePickerButton from '../components/ui/ImagePickerButton.tsx'
import ImageThumb, { ImageThumbList } from '../components/ui/ImageThumb.tsx'
import { useImageAlts } from '../hooks/useImageAlts.ts'
import { galleryService } from '../services/gallery.ts'
import ModalCloseButton from '../components/ui/ModalCloseButton.tsx'
import CreatableDropdown from '../components/ui/CreatableDropdown.tsx'
import FieldHint from '../components/ui/FieldHint.tsx'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'])
const TITLE_MIN_LENGTH = 5
const DESCRIPTION_MIN_LENGTH = 20

interface SelectedImage {
	file: File
	previewUrl: string
}

function releasePreviews(list: SelectedImage[]) {
	list.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
}

interface AdminAlbumCardProps {
	gallery?: Gallery
	onEdit?: () => void
	onDelete?: () => void
	onToggleFeatured?: () => void
	loading?: boolean
}

function AdminAlbumCard({ gallery, onEdit, onDelete, onToggleFeatured, loading = false }: Readonly<AdminAlbumCardProps>) {
	const { t } = useTranslation()

	if (loading) {
		return (
			<article className="h-full rounded-3xl border border-neutral-100 bg-white shadow-sm">
				<div className="m-sm overflow-hidden rounded-[20px]">
					<Skeleton shape="rect" className="aspect-[4/3] w-full" />
				</div>
				<div className="flex flex-col gap-sm px-lg pb-lg text-left">
					<Skeleton shape="line" className="h-5 w-4/5" />
					<Skeleton shape="line" className="h-4 w-full" />
					<Skeleton shape="line" className="h-4 w-2/3" />
					<div className="mt-sm flex items-center justify-end gap-xs">
						<Skeleton shape="circle" className="size-10" />
						<Skeleton shape="circle" className="size-10" />
					</div>
				</div>
			</article>
		)
	}

	return (
		<article className="group relative h-full rounded-3xl border border-neutral-100 bg-white shadow-sm card-hover">
			<div className="relative m-sm overflow-hidden rounded-[20px]">
				<img
					src={gallery!.galleryImages[0]?.fileUrl ?? ninos2}
					alt={gallery!.title}
					className="block aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
				/>
				<span className="absolute bottom-sm left-sm rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white shadow">
					{t('home.galeria.photoCount', { count: gallery!.galleryImages.length })}
				</span>
				<CardActionButton
					action="feature"
					pressed={gallery!.featured}
					label={t('admin.gallery.toggleFeatured')}
					title={t('admin.gallery.toggleFeatured')}
					onClick={onToggleFeatured}
					className="absolute left-sm top-sm"
				/>
			</div>

			<div className="overflow-hidden px-lg pb-lg text-left">
				<h3 className="m-0 truncate font-heading text-h4 font-bold text-heading" title={gallery!.title}>
					{gallery!.title}
				</h3>
				<p className="mt-xs line-clamp-5 min-h-[7.5em] font-body text-body-sm font-normal leading-[1.5] text-body-text-dark">
					{gallery!.description}
				</p>

				<div className="mt-sm flex items-center justify-end gap-xs">
					<CardActionButton action="edit" label={t('admin.edit')} onClick={onEdit} />
					<CardActionButton action="delete" label={t('admin.delete')} onClick={onDelete} />
				</div>
			</div>
		</article>
	)
}

interface AdminAlbumsByYearProps {
	categories: GalleryCategory[]
	galleriesByCategory: Record<string, Gallery[]>
	onEdit: (gallery: Gallery) => void
	onDelete: (gallery: Gallery) => void
	onToggleFeatured: (gallery: Gallery) => void
	mobileArrowsSlot: HTMLElement | null
}

const ALL_YEARS = 'all'

const yearTabsClass = tabCarouselClass.replace(' md:flex-wrap md:overflow-visible', '')

function AdminAlbumsByYear({
	categories,
	galleriesByCategory,
	onEdit,
	onDelete,
	onToggleFeatured,
	mobileArrowsSlot,
}: Readonly<AdminAlbumsByYearProps>) {
	const { t } = useTranslation()
	const reduceMotion = useReducedMotion()
	const years = categories.filter((category) => (galleriesByCategory[category.id] ?? []).length > 0)
	const tabs = [{ id: ALL_YEARS, title: t('home.galeria.filterAll') }, ...years]
	const [selectedId, setSelectedId] = useState<string>(ALL_YEARS)
	const activeId = tabs.some((tab) => tab.id === selectedId) ? selectedId : ALL_YEARS
	const tabRowRef = useTabCarousel(activeId)
	const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' })
	const [prevEnabled, setPrevEnabled] = useState(false)
	const [nextEnabled, setNextEnabled] = useState(false)

	useEffect(() => {
		if (!emblaApi) return
		const updateScrollButtons = () => {
			setPrevEnabled(emblaApi.canScrollPrev())
			setNextEnabled(emblaApi.canScrollNext())
		}
		updateScrollButtons()
		emblaApi.on('select', updateScrollButtons)
		emblaApi.on('reInit', updateScrollButtons)
		return () => {
			emblaApi.off('select', updateScrollButtons)
			emblaApi.off('reInit', updateScrollButtons)
		}
	}, [emblaApi])

	if (years.length === 0) return null
	const arrows = (className: string) => (prevEnabled || nextEnabled) && (
		<div className={`${className} shrink-0 gap-sm`}>
			<button
				type="button"
				onClick={() => emblaApi?.scrollPrev()}
				disabled={!prevEnabled}
				aria-label={t('admin.gallery.prevAlbums')}
				className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-sm transition hover:bg-neutral-50 disabled:opacity-40"
			>
				<ChevronLeftIcon size={18} />
			</button>
			<button
				type="button"
				onClick={() => emblaApi?.scrollNext()}
				disabled={!nextEnabled}
				aria-label={t('admin.gallery.nextAlbums')}
				className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-sm transition hover:bg-neutral-50 disabled:opacity-40"
			>
				<ChevronRightIcon size={18} />
			</button>
		</div>
	)
	const galleries = activeId === ALL_YEARS
		? years.flatMap((category) => galleriesByCategory[category.id] ?? [])
		: (galleriesByCategory[activeId] ?? [])

	return (
		<div className="mt-sm">
			<div className="flex items-center gap-md">
				<div ref={tabRowRef} role="tablist" aria-label={t('admin.gallery.albumYear')} className={`${yearTabsClass} min-w-0 flex-1`}>
					{tabs.map((category) => {
						const isActive = category.id === activeId
						return (
							<button
								key={category.id}
								type="button"
								role="tab"
								aria-selected={isActive}
								onClick={() => setSelectedId(category.id)}
								className={`relative rounded-full border border-green-500 px-md py-xs font-body text-body-sm transition duration-300 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
									isActive ? 'text-white' : 'bg-transparent text-heading hover:bg-green-50'
								}`}
							>
								{isActive && <TabHighlight layoutId="admin-gallery-year-tab" className="bg-green-500" />}
								{category.title}
							</button>
						)
					})}
				</div>
				{arrows('hidden md:flex')}
				{mobileArrowsSlot && createPortal(arrows('flex md:hidden'), mobileArrowsSlot)}
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={activeId}
					role="tabpanel"
					initial={reduceMotion ? false : { opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
					transition={{ duration: 0.22, ease: 'easeOut' }}
					className="mt-sm overflow-hidden"
					ref={emblaRef}
				>
					<div className="flex gap-md py-md">
						{galleries.map((gallery) => (
							<div key={gallery.id} className="min-w-0 flex-[0_0_260px] md:flex-[0_0_280px]">
								<AdminAlbumCard
									gallery={gallery}
									onEdit={() => onEdit(gallery)}
									onDelete={() => onDelete(gallery)}
									onToggleFeatured={() => onToggleFeatured(gallery)}
								/>
							</div>
						))}
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

function AlbumCarouselSkeleton({ albums }: Readonly<{ albums: number }>) {
	return (
		<div className="mt-xl">
			<Skeleton shape="pill" className="h-9 w-32" />
			<div className="mt-md flex gap-md py-md">
				<SkeletonList count={albums}>{() => <div className="min-w-0 flex-[0_0_260px] md:flex-[0_0_280px]"><AdminAlbumCard loading /></div>}</SkeletonList>
			</div>
		</div>
	)
}

const emptyForm: GalleryRequest = {
	categoryId: '',
	title: '',
	description: '',
	featured: false,
}

function AdminGalleryPage() {
	const { t, i18n } = useTranslation()
	const language = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
	const {
		categories,
		galleriesByCategory,
		loading,
		error,
		fetchAll,
		createCategory,
		deleteCategory,
		createGallery,
		updateGallery,
		deleteGallery,
		uploadImages,
		deleteImage,
	} = useGalleryAdmin()

	const [formOpen, setFormOpen] = useState(false)
	const [mobileArrowsSlot, setMobileArrowsSlot] = useState<HTMLDivElement | null>(null)
	const [editing, setEditing] = useState<Gallery | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Gallery | null>(null)
	const [deleteYearTarget, setDeleteYearTarget] = useState<GalleryCategory | null>(null)
	const [imageToDelete, setImageToDelete] = useState<string | null>(null)
	const [form, setForm] = useState<GalleryRequest>(emptyForm)
	const [formError, setFormError] = useState<string | null>(null)
	const [titleError, setTitleError] = useState<string | null>(null)
	const [descriptionError, setDescriptionError] = useState<string | null>(null)
	const [files, setFiles] = useState<SelectedImage[]>([])
	const [fileError, setFileError] = useState<string | null>(null)
	const [images, setImages] = useState<GalleryImage[]>([])
	const imageAlts = useImageAlts()
	const missingAltCount = images.filter((image) => !imageAlts.existingValue(image).trim()).length
	const [submitting, setSubmitting] = useState(false)
	const filesRef = useRef<SelectedImage[]>([])

	useEffect(() => {
		filesRef.current = files
	})

	useEffect(() => {
		return () => {
			releasePreviews(filesRef.current)
		}
	}, [])

	useEffect(() => {
		void fetchAll(language)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language])

	const openCreate = () => {
		setEditing(null)
		setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
		setFormError(null)
		setTitleError(null)
		setDescriptionError(null)
		resetSelectedFiles()
		setImages([])
		imageAlts.reset()
		setFormOpen(true)
	}

	const openEdit = (gallery: Gallery) => {
		const categoryId = Object.entries(galleriesByCategory).find(([, galleries]) =>
			galleries.some((g) => g.id === gallery.id),
		)?.[0] ?? ''

		setEditing(gallery)
		setForm({
			categoryId,
			title: gallery.title,
			description: gallery.description,
			featured: gallery.featured,
		})
		setFormError(null)
		setTitleError(null)
		setDescriptionError(null)
		resetSelectedFiles()
		setImages([...gallery.galleryImages])
		imageAlts.reset()
		setFormOpen(true)
	}

	const closeForm = () => {
		setFormOpen(false)
		setEditing(null)
		setFormError(null)
		setTitleError(null)
		setDescriptionError(null)
		resetSelectedFiles()
		setImages([])
	}

	const { closing: formClosing, requestClose } = useModalExit(closeForm)

	const resetSelectedFiles = () => {
		releasePreviews(files)
		setFiles([])
		setFileError(null)
	}

	const handleFilesSelected = (selected: File[]) => {
		if (selected.length === 0) return

		const valid: File[] = []
		const rejected: string[] = []

		selected.forEach((file) => {
			if (ALLOWED_IMAGE_TYPES.has(file.type)) valid.push(file)
			else rejected.push(file.name)
		})

		setFileError(
			rejected.length > 0
				? t('admin.gallery.invalidFileType', { name: rejected[0] })
				: null,
		)

		setFiles((prev) => [
			...prev,
			...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
		])
	}

	const removeSelectedFile = (index: number) => {
		const target = files[index]
		if (target) URL.revokeObjectURL(target.previewUrl)
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!form.categoryId) {
			setFormError(t('admin.gallery.requiredYear'))
			return
		}

		const titleErrorMessage =
			validateRequired(form.title, t('admin.gallery.albumTitle'), t) ??
			validateMinLength(form.title, TITLE_MIN_LENGTH, t) ??
			validateSafeText(form.title, t)
		const descriptionErrorMessage =
			validateRequired(form.description, t('admin.gallery.albumDescription'), t) ??
			validateMinLength(form.description, DESCRIPTION_MIN_LENGTH, t) ??
			validateSafeText(form.description, t)

		setTitleError(titleErrorMessage)
		setDescriptionError(descriptionErrorMessage)

		const altsValid = imageAlts.validate(files.map(({ file }) => file), images, t)

		if (titleErrorMessage || descriptionErrorMessage || !altsValid) return

		const data: GalleryRequest = {
			categoryId: form.categoryId,
			title: form.title.trim(),
			description: form.description.trim(),
			featured: form.featured,
		}

		setSubmitting(true)
		try {
			const saved = editing
				? await updateGallery(editing.id, data)
				: await createGallery(data)

			if (files.length) {
				const newFiles = files.map(({ file }) => file)
				await uploadImages(saved.id, newFiles, data.title, imageAlts.altsFor(newFiles))
			}
			await Promise.all(imageAlts.changed(images).map(({ id, altText }) => galleryService.updateImageAlt(String(id), altText)))

			notify.success({
				title: editing ? t('admin.gallery.albumUpdatedTitle') : t('admin.gallery.albumCreatedTitle'),
				description: editing
					? t('admin.gallery.albumUpdatedDescription')
					: t('admin.gallery.albumCreatedDescription'),
			})

			requestClose()
			void fetchAll(language)
		} catch (err) {
			notifyError(t('admin.gallery.albumSaveErrorTitle'), err)
		} finally {
			setSubmitting(false)
		}
	}

	const handleCreateYear = async (title: string) => {
		try {
			const created = await createCategory({ title })
			if (created) {
				setForm((prev) => ({ ...prev, categoryId: created.id }))
				setFormError(null)
				notify.success(t('admin.gallery.yearCreatedTitle'))
			}
		} catch (err) {
			notifyError(t('admin.gallery.yearCreateErrorTitle'), err)
		}
	}

	const handleDeleteGallery = async (gallery: Gallery) => {
		try {
			await deleteGallery(gallery.id)
			if (editing?.id === gallery.id) requestClose()
			notify.success({
				title: t('admin.gallery.albumDeletedTitle'),
				description: t('admin.gallery.albumDeletedDescription'),
			})
		} catch (err) {
			notifyError(t('admin.gallery.albumDeleteErrorTitle'), err)
			throw err
		}
	}

	const handleDeleteYear = async (category: GalleryCategory) => {
		try {
			await deleteCategory(category.id)
			setForm((prev) =>
				prev.categoryId === category.id ? { ...prev, categoryId: '' } : prev
			)
			notify.success(t('admin.gallery.yearDeletedTitle'))
		} catch (err) {
			notifyError(t('admin.gallery.yearDeleteErrorTitle'), err)
			throw err
		}
	}

	const confirmDeleteImage = async () => {
		if (!editing || !imageToDelete) return
		try {
			await deleteImage(editing.id, imageToDelete)
			setImages((prev) => prev.filter((image) => image.id !== imageToDelete))
			notify.success(t('admin.gallery.imageDeletedTitle'))
		} catch (err) {
			notifyError(t('admin.gallery.imageDeleteErrorTitle'), err)
			throw err
		}
	}

	const handleToggleFeatured = async (gallery: Gallery) => {
		try {
			await updateGallery(gallery.id, {
				categoryId: Object.entries(galleriesByCategory).find(([, galleries]) =>
					galleries.some((g) => g.id === gallery.id),
				)?.[0] ?? '',
				title: gallery.title,
				description: gallery.description,
				featured: !gallery.featured,
			})
			notify.success(
				gallery.featured
					? t('admin.gallery.featuredRemovedTitle')
					: t('admin.gallery.featuredAddedTitle'),
			)
			void fetchAll(language)
		} catch (err) {
			notifyError(t('admin.gallery.featuredErrorTitle'), err)
		}
	}

	const idleSubmitLabel = editing ? t('admin.save') : t('admin.gallery.publish')

	const visibleAlbumRows = categories.map((category) => galleriesByCategory[category.id]?.length ?? 0).filter((count) => count > 0)
	const albumSkeletonCount = useSkeletonCount('admin-gallery-albums', loading, Math.min(4, Math.max(0, ...visibleAlbumRows)), 3)

	return (
		<AdminLayout>
			<div className="flex flex-wrap items-start justify-between gap-md">
				<div>
					<h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
						{t('admin.gallery.title')}
					</h1>
					<p className="mt-2 font-body text-body text-neutral-500">
						{t('admin.gallery.subtitle')}
					</p>
				</div>
				<div className="flex w-full items-center justify-between gap-md md:w-auto">
					<button
						type="button"
						onClick={openCreate}
						className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
					>
						<PlusIcon size={18} aria-hidden="true" />
						{t('admin.gallery.addAlbum')}
					</button>
					<div ref={setMobileArrowsSlot} className="md:hidden" />
				</div>
			</div>

			{error && <p className="mt-lg rounded-xl bg-red-50 p-md text-body-sm text-red-700">{error}</p>}

			{formOpen && (
				<div className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]">
					<button
						type="button"
						tabIndex={-1}
						aria-label={t('admin.gallery.close')}
						className="absolute inset-0 size-full cursor-default"
						onClick={requestClose}
					/>

					<form onSubmit={handleSubmit} className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${formClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}>
					<div className="flex items-center justify-between gap-md">
						<h2 className="m-0 font-heading text-h4 font-bold text-heading">
							{editing ? t('admin.gallery.editAlbum') : t('admin.gallery.newAlbum')}
						</h2>
						<ModalCloseButton
							onClick={requestClose}
							aria-label={t('admin.gallery.close')}
						/>
					</div>

					<div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
						<label className="font-body text-body-sm font-semibold text-heading">
							{t('admin.gallery.albumTitle')}
							<input
								placeholder={t('fields.gallery.title.placeholder')}
								maxLength={70}
								value={form.title}
								onChange={(e) => {
									setForm({ ...form, title: e.target.value })
									if (titleError) setTitleError(null)
								}}
								className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
							/>
							<FieldHint>{t('fields.gallery.title.hint')}</FieldHint>
							{titleError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{titleError}</p>
							)}
						</label>

						<label className="font-body text-body-sm font-semibold text-heading">
							{t('admin.gallery.albumYear')}
							<CreatableDropdown
								options={categories.map((category) => ({ id: category.id, label: category.title }))}
								value={form.categoryId}
								onChange={(categoryId) => {
									setForm((prev) => ({ ...prev, categoryId }))
									setFormError(null)
								}}
								onCreate={handleCreateYear}
								onDelete={(option) => setDeleteYearTarget(categories.find((category) => category.id === option.id) ?? null)}
								labels={{
									placeholder: t('admin.gallery.selectYear'),
									add: t('admin.gallery.addNewYear'),
									newPlaceholder: t('admin.gallery.newYearPlaceholder'),
									delete: t('admin.gallery.deleteYear'),
								}}
							/>
							<FieldHint>{t('fields.gallery.year.hint')}</FieldHint>
							{formError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{formError}</p>
							)}
						</label>

						<label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
							{t('admin.gallery.albumDescription')}
							<textarea
								placeholder={t('fields.gallery.description.placeholder')}
								maxLength={200}
								rows={4}
								value={form.description}
								onChange={(e) => {
									setForm({ ...form, description: e.target.value })
									if (descriptionError) setDescriptionError(null)
								}}
								className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
							/>
							<FieldHint>{t('fields.gallery.description.hint')}</FieldHint>
							{descriptionError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{descriptionError}</p>
							)}
						</label>

						<CheckboxField
							checked={form.featured}
							onChange={(featured) => setForm({ ...form, featured })}
							className="md:col-span-2"
						>
							<StarIcon size={16} aria-hidden="true" className={form.featured ? 'text-yellow-500' : 'text-neutral-400'} />
							{t('admin.gallery.featured')}
						</CheckboxField>

						<div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
							<span className="block">{t('admin.gallery.photos')}</span>
							<ImagePickerButton
								label={t('admin.gallery.chooseImages')}
								accept="image/png,image/jpg,image/jpeg,image/svg+xml"
								multiple
								onSelect={handleFilesSelected}
							/>

							{fileError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{fileError}</p>
							)}

							{files.length > 0 && (
								<ImageThumbList className="mt-sm">
									{files.map((selected, index) => (
										<ImageThumb
											key={selected.previewUrl}
											src={selected.previewUrl}
											label={t('common.imageGallery')}
											onDelete={() => removeSelectedFile(index)}
											deleteLabel={`${t('admin.delete')}: ${selected.file.name}`}
											altText={imageAlts.newValue(selected.file)}
											onAltChange={(value) => imageAlts.setNewValue(selected.file, value)}
											altError={imageAlts.newError(selected.file)}
											altLabel={t('common.imageAltLabel')}
											altPlaceholder={t('common.imageAltPlaceholder')}
										/>
									))}
								</ImageThumbList>
							)}
						</div>
					</div>

					{images.length > 0 && (
						<ImageThumbList
							title={t('admin.gallery.currentImages')}
							collapsible
							summary={[
								t('admin.gallery.currentImagesCount', { count: images.length }),
								missingAltCount > 0 ? t('admin.gallery.currentImagesMissingAlt', { count: missingAltCount }) : null,
							].filter(Boolean).join(' · ')}
							forceOpen={images.some((image) => imageAlts.existingError(image.id))}
						>
							{images.map((image) => (
								<ImageThumb
									key={image.id}
									src={image.fileUrl}
									label={t('common.imageGallery')}
									onDelete={() => setImageToDelete(image.id)}
									deleteLabel={t('admin.delete')}
									altText={imageAlts.existingValue(image)}
									onAltChange={(value) => imageAlts.setExistingValue(image.id, value)}
									altError={imageAlts.existingError(image.id)}
									altLabel={t('common.imageAltLabel')}
									altPlaceholder={t('common.imageAltPlaceholder')}
								/>
							))}
						</ImageThumbList>
					)}

					<div className="mt-lg flex justify-end gap-md *:flex-1">
						<button
							type="button"
							onClick={requestClose}
							className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
						>
							{t('admin.cancel')}
						</button>
						<button
							type="submit"
							disabled={submitting || !form.title.trim() || !form.description.trim() || !form.categoryId}
							className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
						>
							{submitting ? t('common.loading') : idleSubmitLabel}
						</button>
					</div>
					</form>
				</div>
			)}

			<section className="mt-xl">
				{loading && !formOpen && (
					<output className="contents" aria-label={t('common.loading')}>
						<AlbumCarouselSkeleton albums={albumSkeletonCount} />
					</output>
				)}

				{categories.length === 0 && !loading && (
					<p className="border-t border-neutral-200 py-xl text-body-sm text-neutral-500">
						{t('admin.gallery.noCategories')}
					</p>
				)}

				{!loading && (
					<AdminAlbumsByYear
						categories={categories}
						galleriesByCategory={galleriesByCategory}
						onEdit={(gallery) => openEdit(gallery)}
						onDelete={(gallery) => setDeleteTarget(gallery)}
						onToggleFeatured={handleToggleFeatured}
						mobileArrowsSlot={mobileArrowsSlot}
					/>
				)}
			</section>

			{deleteTarget && (
				<DeleteAlbumModal
					gallery={deleteTarget}
					onConfirm={() => handleDeleteGallery(deleteTarget)}
					onClose={() => setDeleteTarget(null)}
				/>
			)}

			{deleteYearTarget && (
				<DeleteYearModal
					category={deleteYearTarget}
					onConfirm={() => handleDeleteYear(deleteYearTarget)}
					onClose={() => setDeleteYearTarget(null)}
				/>
			)}

			{imageToDelete && (
				<DeleteConfirmModal
					title={t('admin.gallery.deleteImageModalTitle')}
					message={t('admin.gallery.deleteImageModalMessage')}
					onConfirm={confirmDeleteImage}
					onClose={() => setImageToDelete(null)}
				/>
			)}
		</AdminLayout>
	)
}

export default AdminGalleryPage