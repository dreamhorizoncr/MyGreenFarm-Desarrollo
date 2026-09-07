import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import { useAnnouncements } from '../hooks/useAnnouncements.ts'
import type {
	Announcement,
	AnnouncementImageResponse,
	AnnouncementRequest,
	AnnouncementType,
} from '../types/announcement.ts'

const emptyForm: AnnouncementRequest = {
	title: '',
	content: '',
	type: 'NEWS',
	eventDate: '',
	location: '',
}

const typeLabels: Record<AnnouncementType, string> = {
	NEWS: 'Noticia',
	EVENT: 'Evento',
	NOTICE: 'Aviso',
	GENERAL: 'General',
}

function AnnouncementsPage() {
	const {
		announcements,
		loading,
		error,
		fetchAnnouncements,
		createAnnouncement,
		updateAnnouncement,
		deleteAnnouncement,
		getImages,
		uploadImages,
		deleteImage,
	} = useAnnouncements()
	const [formOpen, setFormOpen] = useState(false)
	const [editing, setEditing] = useState<Announcement | null>(null)
	const [form, setForm] = useState<AnnouncementRequest>(emptyForm)
	const [cover, setCover] = useState<File | null>(null)
	const [gallery, setGallery] = useState<File[]>([])
	const [images, setImages] = useState<AnnouncementImageResponse[]>([])
	const coverInputRef = useRef<HTMLInputElement>(null)
	const galleryInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		void fetchAnnouncements('es')
	}, [])

	const openCreate = () => {
		setEditing(null)
		setForm(emptyForm)
		setCover(null)
		setGallery([])
		setImages([])
		setFormOpen(true)
	}

	const openEdit = async (announcement: Announcement) => {
		setEditing(announcement)
		setForm({
			title: announcement.title,
			content: announcement.content,
			type: announcement.type,
			eventDate: announcement.eventDate?.slice(0, 16) ?? '',
			location: announcement.location ?? '',
		})
		setCover(null)
		setGallery([])
		setImages(await getImages(announcement.id))
		setFormOpen(true)
	}

	const closeForm = () => {
		setFormOpen(false)
		setEditing(null)
		setImages([])
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const data: AnnouncementRequest = {
			...form,
			eventDate: form.eventDate || undefined,
			location: form.location?.trim() || undefined,
		}

		try {
			const saved = editing
				? await updateAnnouncement(editing.id, data)
				: await createAnnouncement(data)

			if (cover) await uploadImages(saved.id, [cover], true)
			if (gallery.length) await uploadImages(saved.id, gallery, false)
			closeForm()
		} catch {
			// El hook mantiene el mensaje visible en la pantalla.
		}
	}

	const handleDelete = async (announcement: Announcement) => {
		if (!window.confirm(`¿Eliminar "${announcement.title}"?`)) return
		await deleteAnnouncement(announcement.id)
		if (editing?.id === announcement.id) closeForm()
	}

	const handleDeleteImage = async (image: AnnouncementImageResponse) => {
		await deleteImage(image.id)
		setImages((current) => current.filter((item) => item.id !== image.id))
	}

	return (
		<AdminLayout>
			<div className="flex flex-wrap items-start justify-between gap-md">
				<div>
					<h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
						Noticias
					</h1>
					<p className="mt-2 font-body text-base text-neutral-500">
						Agregá noticias para mantener informadas a las familias.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex h-11 items-center gap-xs rounded-full bg-heading px-lg font-body text-sm font-semibold text-white"
				>
					<Plus size={18} aria-hidden="true" />
					Añadir noticia
				</button>
			</div>

			{error && <p className="mt-lg rounded-xl bg-red-50 p-md text-sm text-red-700">{error}</p>}

			{formOpen && (
				<form onSubmit={handleSubmit} className="mt-xl border-t border-neutral-200 pt-xl">
					<div className="flex items-center justify-between gap-md">
						<h2 className="m-0 font-heading text-2xl font-bold text-heading">
							{editing ? 'Editar noticia' : 'Nueva noticia'}
						</h2>
						<button type="button" onClick={closeForm} aria-label="Cerrar formulario" className="text-neutral-500">
							<X size={20} />
						</button>
					</div>

					<div className="mt-lg grid gap-md md:grid-cols-2">
						<label className="font-body text-sm font-semibold text-heading">
							Título
							<input required minLength={5} maxLength={70} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading" />
						</label>
						<label className="font-body text-sm font-semibold text-heading">
							Tipo
							<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AnnouncementType })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading">
								{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
							</select>
						</label>
						<label className="font-body text-sm font-semibold text-heading md:col-span-2">
							Contenido
							<textarea required minLength={20} maxLength={1500} rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading" />
						</label>
						<label className="font-body text-sm font-semibold text-heading">
							Locación
							<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading" />
						</label>
						<label className="font-body text-sm font-semibold text-heading">
							Fecha y hora del evento
							<input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading" />
						</label>
						<div className="font-body text-sm font-semibold text-heading">
							<span className="block">Imagen de portada</span>
							<input
								ref={coverInputRef}
								type="file"
								accept="image/png,image/jpg,image/jpeg,image/svg+xml"
								onChange={(e) => setCover(e.target.files?.[0] ?? null)}
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => coverInputRef.current?.click()}
								className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-sm font-semibold text-heading"
							>
								<ImagePlus size={17} aria-hidden="true" />
								Elegir portada
							</button>
							{cover && <p className="mt-xs text-xs font-normal text-neutral-500">{cover.name}</p>}
						</div>
						<div className="font-body text-sm font-semibold text-heading">
							<span className="block">Imágenes de galería (máximo 4)</span>
							<input
								ref={galleryInputRef}
								type="file"
								multiple
								accept="image/png,image/jpg,image/jpeg,image/svg+xml"
								onChange={(e) => setGallery(Array.from(e.target.files ?? []).slice(0, 4))}
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => galleryInputRef.current?.click()}
								className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-sm font-semibold text-heading"
							>
								<ImagePlus size={17} aria-hidden="true" />
								Elegir imágenes
							</button>
							{gallery.length > 0 && <p className="mt-xs text-xs font-normal text-neutral-500">{gallery.length} archivo(s) seleccionado(s)</p>}
						</div>
					</div>

					{images.length > 0 && (
						<div className="mt-lg">
							<h3 className="font-body text-sm font-semibold text-heading">Imágenes actuales</h3>
							<div className="mt-sm flex flex-wrap gap-md">
								{images.map((image) => (
									<div key={image.id} className="flex items-center gap-sm rounded-xl border border-neutral-200 bg-white p-xs">
										<img src={image.fileUrl} alt="" className="size-16 rounded-lg object-cover" />
										<span className="text-xs text-neutral-500">{image.isCover ? 'Portada' : 'Galería'}</span>
										<button type="button" onClick={() => void handleDeleteImage(image)} aria-label="Eliminar imagen" className="text-danger"><Trash2 size={16} /></button>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="mt-lg flex flex-wrap justify-end gap-sm">
						<button type="button" onClick={closeForm} className="rounded-full border border-neutral-300 px-lg py-sm font-body text-sm font-semibold text-heading">Cancelar</button>
						<button type="submit" disabled={loading} className="rounded-full bg-heading px-lg py-sm font-body text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Publicar noticia'}</button>
					</div>
				</form>
			)}

			<section className="mt-xl grid gap-md">
				{loading && !formOpen && (
					<div className="flex items-center gap-sm border-t border-neutral-200 py-xl text-sm text-neutral-500" role="status">
						<span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-heading" aria-hidden="true" />
						Cargando noticias...
					</div>
				)}
				{announcements.map((announcement) => (
					<article key={announcement.id} className="border-t border-neutral-200 py-lg">
						<div className="flex flex-wrap items-start justify-between gap-md">
							<div>
								<span className="text-xs font-semibold uppercase tracking-wide text-green-700">{typeLabels[announcement.type]}</span>
								<h2 className="mt-xs font-heading text-xl font-bold text-heading">{announcement.title}</h2>
								<p className="mt-xs whitespace-pre-line text-sm text-neutral-600">{announcement.content}</p>
								{(announcement.location || announcement.eventDate) && <p className="mt-sm text-xs text-neutral-500">{announcement.location}{announcement.location && announcement.eventDate ? ' · ' : ''}{announcement.eventDate ? new Date(announcement.eventDate).toLocaleString() : ''}</p>}
							</div>
							<div className="flex shrink-0 gap-sm">
								<button type="button" onClick={() => void openEdit(announcement)} aria-label="Editar noticia" className="rounded-full border border-neutral-300 p-sm text-heading"><Pencil size={17} /></button>
								<button type="button" onClick={() => void handleDelete(announcement)} aria-label="Eliminar noticia" className="rounded-full border border-red-200 p-sm text-danger"><Trash2 size={17} /></button>
							</div>
						</div>
					</article>
				))}
				{!loading && announcements.length === 0 && <p className="border-t border-neutral-200 py-xl text-sm text-neutral-500">Todavía no hay noticias publicadas.</p>}
			</section>
		</AdminLayout>
	)
}

export default AnnouncementsPage
