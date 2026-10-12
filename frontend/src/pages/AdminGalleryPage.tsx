import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
	StarIcon,
	Trash2Icon,
	XIcon,
} from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import useDismiss from '../hooks/useDismiss.ts'
import useEmblaCarousel from 'embla-carousel-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import DeleteAlbumModal from '../components/DeleteAlbumModal.tsx'
import DeleteYearModal from '../components/DeleteYearModal.tsx'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import { useGalleryAdmin } from '../hooks/useGalleryAdmin.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { notify } from '../utils/notifications.ts'
import { validateMinLength, validateRequired } from '../utils/validators.ts'
import type { Gallery, GalleryCategory, GalleryImage, GalleryRequest } from '../types/gallery.ts'
import ninos2 from '../assets/imgs/ninos2.svg'
import CardActionButton from '../components/ui/CardActionButton.tsx'
import CheckboxField from '../components/ui/CheckboxField.tsx'
import ImagePickerButton from '../components/ui/ImagePickerButton.tsx'
import ImageThumb, { ImageThumbList } from '../components/ui/ImageThumb.tsx'

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

interface YearDropdownProps {
	categories: GalleryCategory[]
	value: string
	onChange: (categoryId: string) => void
	onCreateYear: (title: string) => Promise<void>
	onDeleteYear: (category: GalleryCategory) => void
}

function YearDropdown({
	categories,
	value,
	onChange,
	onCreateYear,
	onDeleteYear,
}: Readonly<YearDropdownProps>) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [adding, setAdding] = useState(false)
	const yearInputRef = useRef<HTMLInputElement>(null)
	useEffect(() => {
		if (adding) yearInputRef.current?.focus()
	}, [adding])
	const [newYear, setNewYear] = useState('')

	const selected = categories.find((category) => category.id === value)

	// Se cierra al tocar afuera o con Escape (antes era una capa fixed que dentro del modal no cubría la pantalla).
	const rootRef = useRef<HTMLDivElement>(null)
	const closeDropdown = useCallback(() => {
		setOpen(false)
		setAdding(false)
	}, [])
	useDismiss({ ref: rootRef, isOpen: open, onClose: closeDropdown })

	const handleAdd = async () => {
		const title = newYear.trim()
		if (!title) return
		await onCreateYear(title)
		setNewYear('')
		setAdding(false)
		setOpen(false)
	}

	return (
		<div ref={rootRef} className="relative mt-xs">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
			>
				<span className={selected ? 'text-heading' : 'text-neutral-500'}>
					{selected ? selected.title : t('admin.gallery.selectYear')}
				</span>
				<ChevronDownIcon
					size={18}
					aria-hidden="true"
					className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
				/>
			</button>

			{open && (
				<>
					<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white p-xs shadow-lg">
						{categories.map((category) => (
							<div
								key={category.id}
								className="flex w-full items-center justify-between gap-2 text-body-sm"
							>
								<button
									type="button"
									role="option"
									aria-selected={category.id === value}
									onClick={() => {
										onChange(category.id)
										setOpen(false)
									}}
									className={`flex w-full flex-1 items-center justify-between gap-2 rounded-lg px-md py-sm text-left transition-colors duration-150 hover:bg-orange-100 ${
										category.id === value
											? 'font-semibold text-link'
											: 'text-heading'
									}`}
								>
									<span className="truncate">{category.title}</span>
									{category.id === value && <CheckIcon size={16} className="shrink-0" aria-hidden="true" />}
								</button>
								<button
									type="button"
									onClick={() => onDeleteYear(category)}
									aria-label={`${t('admin.gallery.deleteYear')}: ${category.title}`}
									className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
								>
									<Trash2Icon size={15} />
								</button>
							</div>
						))}

						<div className="mx-lg my-sm border-t border-neutral-200" />

						{adding ? (
							<div className="flex items-center gap-sm px-md py-sm">
								<input
									ref={yearInputRef}
									value={newYear}
									onChange={(e) => setNewYear(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											void handleAdd()
										}
										if (e.key === 'Escape') {
											e.preventDefault()
											setAdding(false)
											setNewYear('')
										}
									}}
									placeholder={t('admin.gallery.newYearPlaceholder')}
									className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 px-sm font-body text-body-sm outline-none focus:border-heading"
								/>
								<button
									type="button"
									onClick={() => void handleAdd()}
									disabled={!newYear.trim()}
									aria-label={t('admin.gallery.addNewYear')}
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-50"
								>
									<CheckIcon size={16} />
								</button>
								<button
									type="button"
									onClick={() => {
										setAdding(false)
										setNewYear('')
									}}
									aria-label={t('admin.cancel')}
									className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
								>
									<XIcon size={16} />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setAdding(true)}
								className="flex w-full items-center gap-sm px-md py-sm text-body-sm font-semibold text-heading transition hover:bg-neutral-50"
							>
								<PlusIcon size={16} aria-hidden="true" />
								{t('admin.gallery.addNewYear')}
							</button>
						)}
					</div>
				</>
			)}
		</div>
	)
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
		<article className="relative h-full rounded-3xl border border-neutral-100 bg-white shadow-sm card-hover">
			<div className="relative m-sm overflow-hidden rounded-[20px]">
				<img
					src={gallery!.galleryImages[0]?.fileUrl ?? ninos2}
					alt={gallery!.title}
					className="block aspect-[4/3] w-full object-cover"
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
					className="absolute left-sm top-sm shadow"
				/>
			</div>

			<div className="overflow-hidden px-lg pb-lg text-left">
				<h3 className="m-0 line-clamp-2 min-h-[2.8em] font-heading text-h5 font-bold text-heading">
					{gallery!.title}
				</h3>
				<p className="-mt-sm line-clamp-5 min-h-[7.5em] font-body text-body-sm font-normal leading-[1.5] text-body-text-dark">
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

interface AdminAlbumCarouselProps {
	categoryTitle: string
	galleries: Gallery[]
	onEdit: (gallery: Gallery) => void
	onDelete: (gallery: Gallery) => void
	onToggleFeatured: (gallery: Gallery) => void
}

function AdminAlbumCarousel({
	categoryTitle,
	galleries,
	onEdit,
	onDelete,
	onToggleFeatured,
}: Readonly<AdminAlbumCarouselProps>) {
	const { t } = useTranslation()
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

	return (
		<div className="mt-xl">
			<div className="flex items-center justify-between gap-md">
				<h3 className="inline-flex rounded-full border border-green-700 bg-green-700 px-md py-xs font-body text-body-sm font-semibold text-white">
					{categoryTitle}
				</h3>
				{(prevEnabled || nextEnabled) && (
					<div className="flex shrink-0 gap-sm">
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
				)}
			</div>

			<div className="mt-md">
				<div className="overflow-hidden" ref={emblaRef}>
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
				</div>
			</div>
		</div>
	)
}

function AlbumCarouselSkeleton() {
	return (
		<div className="mt-xl">
			<Skeleton shape="pill" className="h-9 w-32" />
			<div className="mt-md flex gap-md py-md">
				<div className="min-w-0 flex-[0_0_260px] md:flex-[0_0_280px]"><AdminAlbumCard loading /></div>
				<div className="min-w-0 flex-[0_0_260px] md:flex-[0_0_280px]"><AdminAlbumCard loading /></div>
				<div className="min-w-0 flex-[0_0_260px] md:flex-[0_0_280px]"><AdminAlbumCard loading /></div>
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
			validateMinLength(form.title, TITLE_MIN_LENGTH, t)
		const descriptionErrorMessage =
			validateRequired(form.description, t('admin.gallery.albumDescription'), t) ??
			validateMinLength(form.description, DESCRIPTION_MIN_LENGTH, t)

		setTitleError(titleErrorMessage)
		setDescriptionError(descriptionErrorMessage)

		if (titleErrorMessage || descriptionErrorMessage) return

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

			if (files.length)
				await uploadImages(saved.id, files.map(({ file }) => file), data.title)

			notify.success({
				title: editing ? t('admin.gallery.albumUpdatedTitle') : t('admin.gallery.albumCreatedTitle'),
				description: editing
					? t('admin.gallery.albumUpdatedDescription')
					: t('admin.gallery.albumCreatedDescription'),
			})

			requestClose()
			void fetchAll(language)
		} catch {
			notify.error({
				title: t('admin.gallery.albumSaveErrorTitle'),
				description: t('admin.gallery.albumSaveErrorDescription'),
			})
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
		} catch {
			notify.error(t('admin.gallery.yearCreateErrorTitle'))
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
			notify.error(t('admin.gallery.albumDeleteErrorTitle'))
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
			notify.error(t('admin.gallery.yearDeleteErrorTitle'))
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
			notify.error(t('admin.gallery.imageDeleteErrorTitle'))
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
		} catch {
			notify.error(t('admin.gallery.featuredErrorTitle'))
		}
	}

	const idleSubmitLabel = editing ? t('admin.save') : t('admin.gallery.publish')

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
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
				>
					<PlusIcon size={18} aria-hidden="true" />
					{t('admin.gallery.addAlbum')}
				</button>
			</div>

			{error && <p className="mt-lg rounded-xl bg-red-50 p-md text-body-sm text-red-700">{error}</p>}

			{/* Formulario de álbum */}
			{formOpen && (
				<div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
					<button
						type="button"
						tabIndex={-1}
						aria-label={t('admin.gallery.close')}
						className="absolute inset-0 size-full cursor-default"
						onClick={requestClose}
					/>

					<form onSubmit={handleSubmit} className={`relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${formClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}>
					<div className="flex items-center justify-between gap-md">
						<h2 className="m-0 font-heading text-2xl font-bold text-heading">
							{editing ? t('admin.gallery.editAlbum') : t('admin.gallery.newAlbum')}
						</h2>
						<button
							type="button"
							onClick={requestClose}
							aria-label={t('admin.gallery.close')}
							className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
						>
							<XIcon size={20} />
						</button>
					</div>

					<div className="mt-lg grid gap-md md:grid-cols-2">
						<label className="font-body text-body-sm font-semibold text-heading">
							{t('admin.gallery.albumTitle')}
							<input
								maxLength={70}
								value={form.title}
								onChange={(e) => {
									setForm({ ...form, title: e.target.value })
									if (titleError) setTitleError(null)
								}}
								className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
							/>
							{titleError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{titleError}</p>
							)}
						</label>

						<label className="font-body text-body-sm font-semibold text-heading">
							{t('admin.gallery.albumYear')}
							<YearDropdown
								categories={categories}
								value={form.categoryId}
								onChange={(categoryId) => {
									setForm((prev) => ({ ...prev, categoryId }))
									setFormError(null)
								}}
onCreateYear={handleCreateYear}
							onDeleteYear={(category) => setDeleteYearTarget(category)}
						/>
							{formError && (
								<p className="mt-xs block font-body text-body-sm font-normal text-danger">{formError}</p>
							)}
						</label>

						<label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
							{t('admin.gallery.albumDescription')}
							<textarea
								maxLength={200}
								rows={4}
								value={form.description}
								onChange={(e) => {
									setForm({ ...form, description: e.target.value })
									if (descriptionError) setDescriptionError(null)
								}}
								className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
							/>
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
											label={selected.file.name}
											onDelete={() => removeSelectedFile(index)}
											deleteLabel={`${t('admin.delete')}: ${selected.file.name}`}
										/>
									))}
								</ImageThumbList>
							)}
						</div>
					</div>

					{images.length > 0 && (
						<ImageThumbList title={t('admin.gallery.currentImages')}>
							{images.map((image) => (
								<ImageThumb
									key={image.id}
									src={image.fileUrl}
									label={t('admin.gallery.photoTag')}
									onDelete={() => setImageToDelete(image.id)}
									deleteLabel={t('admin.delete')}
								/>
							))}
						</ImageThumbList>
					)}

					<div className="mt-lg flex flex-wrap justify-end gap-sm">
						<button
							type="button"
							onClick={requestClose}
							className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
						>
							{t('admin.cancel')}
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
						>
							{submitting ? t('common.loading') : idleSubmitLabel}
						</button>
					</div>
					</form>
				</div>
			)}

			{/* Álbumes agrupados por año */}
			<section className="mt-xl border-t border-neutral-200 pt-xl">
				<h2 className="font-heading text-2xl font-bold text-heading">
					{t('admin.gallery.albumsSection')}
				</h2>

				{loading && !formOpen && (
					<output className="contents" aria-label={t('common.loading')}>
						<AlbumCarouselSkeleton />
						<AlbumCarouselSkeleton />
					</output>
				)}

				{categories.length === 0 && !loading && (
					<p className="border-t border-neutral-200 py-xl text-body-sm text-neutral-500">
						{t('admin.gallery.noCategories')}
					</p>
				)}

				{!loading &&
					categories.map((category) => {
						const galleries = galleriesByCategory[category.id] ?? []
						if (galleries.length === 0) return null

						return (
							<AdminAlbumCarousel
								key={category.id}
								categoryTitle={category.title}
								galleries={galleries}
								onEdit={(gallery) => openEdit(gallery)}
								onDelete={(gallery) => setDeleteTarget(gallery)}
								onToggleFeatured={handleToggleFeatured}
							/>
						)
					})}
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