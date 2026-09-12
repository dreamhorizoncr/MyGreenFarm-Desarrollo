import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ImagePlus,
	MoreVertical,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import DeleteAlbumModal from '../components/DeleteAlbumModal.tsx'
import { useGalleryAdmin } from '../hooks/useGalleryAdmin.ts'
import type { Gallery, GalleryCategory, GalleryImage, GalleryRequest } from '../types/gallery.ts'
import ninos2 from '../assets/imgs/niños2.svg'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']

interface SelectedImage {
	file: File
	previewUrl: string
}

function releasePreviews(list: SelectedImage[]) {
	list.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
}

interface AlbumMenuProps {
	onEdit: () => void
	onDelete: () => void
}

function AlbumMenu({ onEdit, onDelete }: AlbumMenuProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (!open) return
		const handleKey = (event: globalThis.KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false)
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [open])

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				aria-label={t('admin.gallery.actions')}
				aria-expanded={open}
				className="flex size-[34px] items-center justify-center rounded-full bg-white text-heading shadow transition hover:bg-neutral-50"
			>
				<MoreVertical size={18} />
			</button>

			{open && (
				<>
					<div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
					<div className="absolute right-0 top-[calc(100%+8px)] z-20 w-max min-w-[150px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-sm shadow-lg">
						<button
							type="button"
							onClick={() => {
								setOpen(false)
								onEdit()
							}}
							className="flex w-full items-center gap-sm px-md py-sm text-sm text-heading transition hover:bg-neutral-50"
						>
							<Pencil size={15} />
							{t('admin.edit')}
						</button>
						<button
							type="button"
							onClick={() => {
								setOpen(false)
								onDelete()
							}}
							className="flex w-full items-center gap-sm px-md py-sm text-sm text-danger transition hover:bg-red-50"
						>
							<Trash2 size={15} />
							{t('admin.delete')}
						</button>
					</div>
				</>
			)}
		</div>
	)
}

interface YearDropdownProps {
	categories: GalleryCategory[]
	value: string
	onChange: (categoryId: string) => void
	onCreateYear: (title: string) => Promise<void>
}

function YearDropdown({ categories, value, onChange, onCreateYear }: YearDropdownProps) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [adding, setAdding] = useState(false)
	const [newYear, setNewYear] = useState('')

	const selected = categories.find((category) => category.id === value)

	useEffect(() => {
		if (!open) return
		const handleKey = (event: globalThis.KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false)
				setAdding(false)
			}
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [open])

	const handleAdd = async () => {
		const title = newYear.trim()
		if (!title) return
		await onCreateYear(title)
		setNewYear('')
		setAdding(false)
		setOpen(false)
	}

	return (
		<div className="relative mt-xs">
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
			>
				<span className={selected ? 'text-heading' : 'text-neutral-500'}>
					{selected ? selected.title : t('admin.gallery.selectYear')}
				</span>
				<ChevronDown
					size={18}
					aria-hidden="true"
					className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
				/>
			</button>

			{open && (
				<>
					<div
						className="fixed inset-0 z-10"
						onClick={() => {
							setOpen(false)
							setAdding(false)
						}}
						aria-hidden="true"
					/>
					<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white py-sm shadow-lg">
						{categories.map((category) => (
							<button
								key={category.id}
								type="button"
								onClick={() => {
									onChange(category.id)
									setOpen(false)
								}}
								className={`flex w-full items-center justify-between px-md py-sm text-sm transition hover:bg-neutral-50 ${
									category.id === value
										? 'font-semibold text-heading'
										: 'text-neutral-600'
								}`}
							>
								{category.title}
								{category.id === value && <Check size={16} aria-hidden="true" />}
							</button>
						))}

						<div className="mx-lg my-sm border-t border-neutral-200" />

						{adding ? (
							<div className="flex items-center gap-sm px-md py-sm">
								<input
									autoFocus
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
									className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 px-sm font-body text-sm outline-none focus:border-heading"
								/>
								<button
									type="button"
									onClick={() => void handleAdd()}
									disabled={!newYear.trim()}
									aria-label={t('admin.save')}
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-50"
								>
									<Check size={16} />
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
									<X size={16} />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setAdding(true)}
								className="flex w-full items-center gap-sm px-md py-sm text-sm font-semibold text-heading transition hover:bg-neutral-50"
							>
								<Plus size={16} aria-hidden="true" />
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
	gallery: Gallery
	onEdit: () => void
	onDelete: () => void
}

function AdminAlbumCard({ gallery, onEdit, onDelete }: AdminAlbumCardProps) {
	const { t } = useTranslation()

	return (
		<article className="relative h-full rounded-3xl border border-neutral-100 bg-white">
			<div className="relative m-sm overflow-hidden rounded-[20px]">
				<img
					src={gallery.galleryImages[0]?.fileUrl ?? ninos2}
					alt={gallery.title}
					className="block aspect-[4/3] w-full object-cover"
				/>
				<span className="absolute bottom-sm left-sm rounded-full bg-orange-500 px-md py-xs font-body text-body-sm font-bold text-white shadow">
					{t('home.galeria.photoCount', { count: gallery.galleryImages.length })}
				</span>
			</div>

			<div className="absolute right-[20px] top-[20px]">
				<AlbumMenu onEdit={onEdit} onDelete={onDelete} />
			</div>

			<div className="h-[128px] overflow-hidden px-lg pb-lg">
				<h3 className="m-0 line-clamp-2 font-heading text-h5 font-bold text-heading">
					{gallery.title}
				</h3>
				<p className="mt-sm line-clamp-2 font-body text-body-sm font-normal leading-[1.5] text-body-text-dark">
					{gallery.description}
				</p>
			</div>
		</article>
	)
}

interface AdminAlbumCarouselProps {
	categoryTitle: string
	galleries: Gallery[]
	onEdit: (gallery: Gallery) => void
	onDelete: (gallery: Gallery) => void
}

function AdminAlbumCarousel({
	categoryTitle,
	galleries,
	onEdit,
	onDelete,
}: AdminAlbumCarouselProps) {
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
				<h3 className="inline-flex rounded-full bg-green-700 px-lg py-sm font-body text-sm font-bold text-white">
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
							<ChevronLeft size={18} />
						</button>
						<button
							type="button"
							onClick={() => emblaApi?.scrollNext()}
							disabled={!nextEnabled}
							aria-label={t('admin.gallery.nextAlbums')}
							className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-sm transition hover:bg-neutral-50 disabled:opacity-40"
						>
							<ChevronRight size={18} />
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
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

const emptyForm: GalleryRequest = {
	categoryId: '',
	title: '',
	description: '',
}

function AdminGalleryPage() {
	const { t } = useTranslation()
	const {
		categories,
		galleriesByCategory,
		loading,
		error,
		fetchAll,
		createCategory,
		createGallery,
		updateGallery,
		deleteGallery,
		uploadImages,
		deleteImage,
	} = useGalleryAdmin()

	const [formOpen, setFormOpen] = useState(false)
	const [editing, setEditing] = useState<Gallery | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Gallery | null>(null)
	const [form, setForm] = useState<GalleryRequest>(emptyForm)
	const [formError, setFormError] = useState<string | null>(null)
	const [files, setFiles] = useState<SelectedImage[]>([])
	const [fileError, setFileError] = useState<string | null>(null)
	const [images, setImages] = useState<GalleryImage[]>([])
	const [submitting, setSubmitting] = useState(false)
	const imagesInputRef = useRef<HTMLInputElement>(null)
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
		void fetchAll()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const openCreate = () => {
		setEditing(null)
		setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
		setFormError(null)
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
		})
		setFormError(null)
		resetSelectedFiles()
		setImages([...gallery.galleryImages])
		setFormOpen(true)
	}

	const closeForm = () => {
		setFormOpen(false)
		setEditing(null)
		setFormError(null)
		resetSelectedFiles()
		setImages([])
	}

	const resetSelectedFiles = () => {
		releasePreviews(files)
		setFiles([])
		setFileError(null)
	}

	const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files
		if (!selected || selected.length === 0) return

		const valid: File[] = []
		const rejected: string[] = []

		Array.from(selected).forEach((file) => {
			if (ALLOWED_IMAGE_TYPES.includes(file.type)) valid.push(file)
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

		event.target.value = ''
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

		const data: GalleryRequest = {
			categoryId: form.categoryId,
			title: form.title.trim(),
			description: form.description.trim(),
		}

		setSubmitting(true)
		try {
			const saved = editing
				? await updateGallery(editing.id, data)
				: await createGallery(data)

			if (files.length)
				await uploadImages(saved.id, files.map(({ file }) => file), data.title)

			closeForm()
			void fetchAll()
		} catch {
			// El hook mantiene el mensaje visible en la pantalla.
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
			}
		} catch {
			// El hook mantiene el mensaje visible en la pantalla.
		}
	}

	const handleDeleteGallery = async (gallery: Gallery) => {
		await deleteGallery(gallery.id)
		if (editing?.id === gallery.id) closeForm()
	}

	const handleDeleteImage = async (imageId: string) => {
		if (!editing) return
		await deleteImage(editing.id, imageId)
		setImages((prev) => prev.filter((image) => image.id !== imageId))
	}

	return (
		<AdminLayout>
			<div className="flex flex-wrap items-start justify-between gap-md">
				<div>
					<h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
						{t('admin.gallery.title')}
					</h1>
					<p className="mt-2 font-body text-base text-neutral-500">
						{t('admin.gallery.subtitle')}
					</p>
				</div>
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-sm font-semibold text-white"
				>
					<Plus size={18} aria-hidden="true" />
					{t('admin.gallery.addAlbum')}
				</button>
			</div>

			{error && <p className="mt-lg rounded-xl bg-red-50 p-md text-sm text-red-700">{error}</p>}

			{/* Formulario de álbum */}
			{formOpen && (
				<form onSubmit={handleSubmit} className="mt-xl border-t border-neutral-200 pt-xl">
					<div className="flex items-center justify-between gap-md">
						<h2 className="m-0 font-heading text-2xl font-bold text-heading">
							{editing ? t('admin.gallery.editAlbum') : t('admin.gallery.newAlbum')}
						</h2>
						<button
							type="button"
							onClick={closeForm}
							aria-label={t('admin.gallery.close')}
							className="text-neutral-500"
						>
							<X size={20} />
						</button>
					</div>

					<div className="mt-lg grid gap-md md:grid-cols-2">
						<label className="font-body text-sm font-semibold text-heading">
							{t('admin.gallery.albumTitle')}
							<input
								required
								minLength={5}
								maxLength={70}
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
							/>
						</label>

						<label className="font-body text-sm font-semibold text-heading">
							{t('admin.gallery.albumYear')}
							<YearDropdown
								categories={categories}
								value={form.categoryId}
								onChange={(categoryId) => {
									setForm((prev) => ({ ...prev, categoryId }))
									setFormError(null)
								}}
								onCreateYear={handleCreateYear}
							/>
							{formError && (
								<p className="mt-xs text-xs font-normal text-red-700">{formError}</p>
							)}
						</label>

						<label className="font-body text-sm font-semibold text-heading md:col-span-2">
							{t('admin.gallery.albumDescription')}
							<textarea
								required
								minLength={20}
								maxLength={200}
								rows={4}
								value={form.description}
								onChange={(e) => setForm({ ...form, description: e.target.value })}
								className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
							/>
						</label>

						<div className="font-body text-sm font-semibold text-heading md:col-span-2">
							<span className="block">{t('admin.gallery.chooseImages')}</span>
							<input
								ref={imagesInputRef}
								type="file"
								multiple
								accept="image/png,image/jpg,image/jpeg,image/svg+xml"
								onChange={handleFilesSelected}
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => imagesInputRef.current?.click()}
								className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-sm font-semibold text-heading"
							>
								<ImagePlus size={17} aria-hidden="true" />
								{t('admin.gallery.chooseImages')}
							</button>

							<p className="mt-xs text-xs font-normal text-neutral-500">
								{t('admin.gallery.addPhotosHelp')}
							</p>

							{fileError && (
								<p className="mt-xs text-xs font-normal text-red-700">{fileError}</p>
							)}

							{files.length > 0 && (
								<div className="mt-md">
									<h3 className="font-body text-sm font-semibold text-heading">
										{t('admin.gallery.newPhotos')}
									</h3>
									<div className="mt-sm grid grid-cols-3 gap-sm sm:grid-cols-4 md:grid-cols-6">
										{files.map((selected, index) => (
											<div key={selected.previewUrl} className="relative">
												<img
													src={selected.previewUrl}
													alt={selected.file.name}
													className="aspect-square w-full rounded-lg border border-neutral-200 object-cover"
												/>
												<button
													type="button"
													onClick={() => removeSelectedFile(index)}
													aria-label={`${t('admin.delete')}: ${selected.file.name}`}
													className="absolute -right-sm -top-sm flex size-[26px] items-center justify-center rounded-full bg-red-600 text-white shadow transition hover:bg-red-700"
												>
													<X size={14} />
												</button>
											</div>
										))}
									</div>
									<p className="mt-sm text-xs font-normal text-neutral-500">
										{files.length} {files.length === 1 ? t('admin.gallery.file') : t('admin.gallery.files')}
									</p>
								</div>
							)}
						</div>
					</div>

					{images.length > 0 && (
						<div className="mt-lg">
							<h3 className="font-body text-sm font-semibold text-heading">
								{t('admin.gallery.currentImages')}
							</h3>
							<div className="mt-sm flex flex-wrap gap-md">
								{images.map((image) => (
									<div
										key={image.id}
										className="flex items-center gap-sm rounded-xl border border-neutral-200 bg-white p-xs"
									>
										<img
											src={image.fileUrl}
											alt=""
											className="size-16 rounded-lg object-cover"
										/>
										<button
											type="button"
											onClick={() => void handleDeleteImage(image.id)}
											aria-label={t('admin.delete')}
											className="text-danger"
										>
											<Trash2 size={16} />
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="mt-lg flex flex-wrap justify-end gap-sm">
						<button
							type="button"
							onClick={closeForm}
							className="rounded-full border border-neutral-300 px-lg py-sm font-body text-sm font-semibold text-heading"
						>
							{t('admin.cancel')}
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="rounded-full bg-heading px-lg py-sm font-body text-sm font-semibold text-white disabled:opacity-60"
						>
							{submitting ? t('common.loading') : editing ? t('admin.save') : t('admin.gallery.publish')}
						</button>
					</div>
				</form>
			)}

			{/* Álbumes agrupados por año */}
			<section className="mt-xl border-t border-neutral-200 pt-xl">
				<h2 className="font-heading text-2xl font-bold text-heading">
					{t('admin.gallery.albumsSection')}
				</h2>

				{loading && !formOpen && (
					<div
						className="flex items-center gap-sm border-t border-neutral-200 py-xl text-sm text-neutral-500"
						role="status"
					>
						<span
							className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-heading"
							aria-hidden="true"
						/>
						{t('common.loading')}
					</div>
				)}

				{categories.length === 0 && !loading && (
					<p className="border-t border-neutral-200 py-xl text-sm text-neutral-500">
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
		</AdminLayout>
	)
}

export default AdminGalleryPage