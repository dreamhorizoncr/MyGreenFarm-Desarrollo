import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { FileImageIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from '@animateicons/react/lucide'
import AdminLayout from "../layout/AdminLayout.tsx";
import { useAnnouncements } from "../hooks/useAnnouncements.ts";
import type {
  Announcement,
  AnnouncementImageResponse,
  AnnouncementRequest,
  AnnouncementType,
} from "../types/announcement.ts";

const emptyForm: AnnouncementRequest = {
  title: "",
  content: "",
  type: "NEWS",
  eventDate: "",
  location: "",
};

const typeLabels: Record<
  AnnouncementType,
  | "adminNews.typeNews"
  | "adminNews.typeEvent"
  | "adminNews.typeNotice"
  | "adminNews.typeGeneral"
> = {
  NEWS: "adminNews.typeNews",
  EVENT: "adminNews.typeEvent",
  NOTICE: "adminNews.typeNotice",
  GENERAL: "adminNews.typeGeneral",
};

type AdminNewsCategory =
	|'All'
	|'NEWS'
	|'EVENT'
	|'NOTICE'
	|'GENERAL'

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
  } = useAnnouncements();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementRequest>(emptyForm);
  const [activeCategory, setActiveCategory] = useState <AdminNewsCategory>('All')
  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [images, setImages] = useState<AnnouncementImageResponse[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    void fetchAnnouncements(i18n.language);
  }, [i18n.language]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCover(null);
    setGallery([]);
    setImages([]);
    setFormOpen(true);
  };

  const openEdit = async (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      eventDate: announcement.eventDate?.slice(0, 16) ?? "",
      location: announcement.location ?? "",
    });
    setCover(null);
    setGallery([]);
    setImages(await getImages(announcement.id));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setImages([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data: AnnouncementRequest = {
      ...form,
      eventDate: form.eventDate || undefined,
      location: form.location?.trim() || undefined,
    };

    try {
      const saved = editing
        ? await updateAnnouncement(editing.id, data)
        : await createAnnouncement(data);

      if (cover) await uploadImages(saved.id, [cover], true);
      if (gallery.length) await uploadImages(saved.id, gallery, false);
      closeForm();
    } catch {
      // El hook mantiene el mensaje visible en la pantalla.
    }
  };

  const handleDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    await deleteAnnouncement(announcementToDelete.id);

    if (editing?.id === announcementToDelete.id) {
      closeForm();
    }

    setDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleDeleteImage = async (image: AnnouncementImageResponse) => {
    await deleteImage(image.id);
    setImages((current) => current.filter((item) => item.id !== image.id));
  };

  const filteredAnnouncements = announcements.filter(
	(announcement)=>
		activeCategory === 'All' || announcement.type === activeCategory
  )

  return (
	<AdminLayout>

		{/* Encabezado */}
		<div className="flex flex-wrap items-start justify-between gap-md">
			<div>
				<h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
					{t('adminNews.title')}
				</h1>

				<p className="mt-2 font-body text-base text-neutral-500">
					{t('adminNews.description')}
				</p>
			</div>

			<button
				type="button"
				onClick={openCreate}
				className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-sm font-semibold text-white"
			>
				<PlusIcon size={18} aria-hidden="true" />
				{t('adminNews.addNews')}
			</button>
		</div>


		{/* Error */}
		{error && (
			<p className="mt-lg rounded-xl bg-red-50 p-md text-sm text-red-700">
				{error}
			</p>
		)}


		{/* Formulario */}
		{formOpen && (
			<form
				onSubmit={handleSubmit}
				className="mt-xl rounded-[20px] border border-neutral-200 bg-white p-lg shadow-sm md:p-xl"
			>
				<div className="flex items-center justify-between gap-md">
					<h2 className="m-0 font-heading text-2xl font-bold text-heading">
						{editing
							? t('adminNews.editNews')
							: t('adminNews.newnews')}
					</h2>

					<button
						type="button"
						onClick={closeForm}
						aria-label="Cerrar formulario"
						className="text-neutral-500"
					>
						<XIcon size={20} />
					</button>
				</div>


				{/* Campos */}
				<div className="mt-lg grid gap-md md:grid-cols-2">

					<label className="font-body text-sm font-semibold text-heading">
						{t('adminNews.newsTitle')}

						<input
							required
							minLength={5}
							maxLength={70}
							value={form.title}
							onChange={(e) =>
								setForm({
									...form,
									title: e.target.value,
								})
							}
							className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
						/>
					</label>


					<label className="font-body text-sm font-semibold text-heading">
						{t('adminNews.newstype')}

						<select
							value={form.type}
							onChange={(e) =>
								setForm({
									...form,
									type: e.target.value as AnnouncementType,
								})
							}
							className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
						>
							{Object.entries(typeLabels).map(([value, label]) => (
								<option key={value} value={value}>
									{t(label)}
								</option>
							))}
						</select>
					</label>


					<label className="font-body text-sm font-semibold text-heading md:col-span-2">
						{t('adminNews.newscontent')}

						<textarea
							required
							minLength={20}
							maxLength={1500}
							rows={6}
							value={form.content}
							onChange={(e) =>
								setForm({
									...form,
									content: e.target.value,
								})
							}
							className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
						/>
					</label>


					<label className="font-body text-sm font-semibold text-heading">
						{t('adminNews.newslocation')}

						<input
							value={form.location}
							onChange={(e) =>
								setForm({
									...form,
									location: e.target.value,
								})
							}
							className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
						/>
					</label>


					<label className="font-body text-sm font-semibold text-heading">
						{t('adminNews.newsdate')}

						<input
							type="datetime-local"
							value={form.eventDate}
							onChange={(e) =>
								setForm({
									...form,
									eventDate: e.target.value,
								})
							}
							className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
						/>
					</label>


					{/* Portada */}
					<div className="font-body text-sm font-semibold text-heading">
						<span className="block">
							{t('adminNews.newscover')}
						</span>

						<input
							ref={coverInputRef}
							type="file"
							accept="image/png,image/jpg,image/jpeg,image/svg+xml"
							onChange={(e) =>
								setCover(e.target.files?.[0] ?? null)
							}
							className="hidden"
						/>

						<button
							type="button"
							onClick={() =>
								coverInputRef.current?.click()
							}
							className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-sm font-semibold text-heading"
						>
							<FileImageIcon size={17} aria-hidden="true" />
							{t('adminNews.chooseCover')}
						</button>

						{cover && (
							<p className="mt-xs text-xs font-normal text-neutral-500">
								{cover.name}
							</p>
						)}
					</div>


					{/* Galería */}
					<div className="font-body text-sm font-semibold text-heading">
						<span className="block">
							{t('adminNews.newsgaleryimages')}
						</span>

						<input
							ref={galleryInputRef}
							type="file"
							multiple
							accept="image/png,image/jpg,image/jpeg,image/svg+xml"
							onChange={(e) =>
								setGallery(
									Array.from(
										e.target.files ?? []
									).slice(0, 4)
								)
							}
							className="hidden"
						/>

						<button
							type="button"
							onClick={() =>
								galleryInputRef.current?.click()
							}
							className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-sm font-semibold text-heading"
						>
							<FileImageIcon size={17} aria-hidden="true" />
							{t('adminNews.newschooseimages')}
						</button>

						{gallery.length > 0 && (
							<p className="mt-xs text-xs font-normal text-neutral-500">
								{gallery.length} archivo(s) seleccionado(s)
							</p>
						)}
					</div>
				</div>


				{/* Imágenes actuales */}
				{images.length > 0 && (
					<div className="mt-lg">
						<h3 className="font-body text-sm font-semibold text-heading">
							{t('adminNews.newsactualimage')}
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

									<span className="text-xs text-neutral-500">
										{image.isCover
											? t('adminNews.newscover')
											: t('adminNews.newsgallery')}
									</span>

									<button
										type="button"
										onClick={() =>
											void handleDeleteImage(image)
										}
										aria-label={t(
											'adminNews.deleteImage'
										)}
										className="text-danger"
									>
										<Trash2Icon size={16} />
									</button>
								</div>
							))}
						</div>
					</div>
				)}


				{/* Botones */}
				<div className="mt-lg flex flex-wrap justify-end gap-sm">
					<button
						type="button"
						onClick={closeForm}
						className="rounded-full border border-neutral-300 px-lg py-sm font-body text-sm font-semibold text-heading"
					>
						{t('adminNews.newscancel')}
					</button>

					<button
						type="submit"
						disabled={loading}
						className="rounded-full bg-heading px-lg py-sm font-body text-sm font-semibold text-white disabled:opacity-60"
					>
						{loading
							? t('adminNews.newssaving')
							: editing
								? t('adminNews.newssavechanges')
								: t('adminNews.newspublish')}
					</button>
				</div>
			</form>
		)}


		{/* Filtros */}
		<div className="mt-xl flex flex-wrap gap-sm">

			<button
				type="button"
				onClick={() => setActiveCategory('All')}
				className={`rounded-full px-md py-sm font-body text-sm transition ${
					activeCategory === 'All'
						? 'bg-orange-500 text-white'
						: 'border border-neutral-300 bg-white text-heading'
				}`}
			>
				{t('adminNews.filterAll')}
			</button>

			<button
				type="button"
				onClick={() => setActiveCategory('NEWS')}
				className={`rounded-full px-md py-sm font-body text-sm transition ${
					activeCategory === 'NEWS'
						? 'bg-orange-500 text-white'
						: 'border border-neutral-300 bg-white text-heading'
				}`}
			>
				{t('adminNews.typeNews')}
			</button>

			<button
				type="button"
				onClick={() => setActiveCategory('EVENT')}
				className={`rounded-full px-md py-sm font-body text-sm transition ${
					activeCategory === 'EVENT'
						? 'bg-orange-500 text-white'
						: 'border border-neutral-300 bg-white text-heading'
				}`}
			>
				{t('adminNews.typeEvent')}
			</button>

			<button
				type="button"
				onClick={() => setActiveCategory('NOTICE')}
				className={`rounded-full px-md py-sm font-body text-sm transition ${
					activeCategory === 'NOTICE'
						? 'bg-orange-500 text-white'
						: 'border border-neutral-300 bg-white text-heading'
				}`}
			>
				{t('adminNews.typeNotice')}
			</button>

			<button
				type="button"
				onClick={() => setActiveCategory('GENERAL')}
				className={`rounded-full px-md py-sm font-body text-sm transition ${
					activeCategory === 'GENERAL'
						? 'bg-orange-500 text-white'
						: 'border border-neutral-300 bg-white text-heading'
				}`}
			>
				{t('adminNews.typeGeneral')}
			</button>

		</div>


		{/* Lista de noticias */}
		<section className="mt-xl grid gap-md">

			{loading && !formOpen && (
				<div
					className="flex items-center gap-sm border-t border-neutral-200 py-xl text-sm text-neutral-500"
					role="status"
				>
					<span
						className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-heading"
						aria-hidden="true"
					/>

					{t('adminNews.newsload')}
				</div>
			)}


			{filteredAnnouncements.map((announcement) => (
				<article
					key={announcement.id}
					className="border-t border-neutral-200 py-lg"
				>
					<div className="flex flex-col gap-md">

						<div>
							<span className="text-xs font-semibold uppercase tracking-wide text-green-700">
								{t(typeLabels[announcement.type])}
							</span>

							<h2 className="mt-xs font-heading text-xl font-bold text-heading">
								{announcement.title}
							</h2>

							<p className="mt-xs whitespace-pre-line text-sm text-neutral-600">
								{announcement.content}
							</p>

							{(announcement.location ||
								announcement.eventDate) && (
								<p className="mt-sm text-xs text-neutral-500">
									{announcement.location}

									{announcement.location &&
									announcement.eventDate
										? ' · '
										: ''}

									{announcement.eventDate
										? new Date(
												announcement.eventDate
											).toLocaleString()
										: ''}
								</p>
							)}
						</div>


						{/* Editar y eliminar */}
						<div className="flex justify-end gap-sm">

							<button
								type="button"
								onClick={() =>
									void openEdit(announcement)
								}
								aria-label={t(
									'adminNews.editButton'
								)}
								className="rounded-full border border-neutral-300 p-sm text-heading"
							>
								<PencilIcon size={17} />
							</button>

							<button
								type="button"
								onClick={() =>
									handleDelete(announcement)
								}
								aria-label={t(
									'adminNews.deleteButton'
								)}
								className="rounded-full border border-red-200 p-sm text-danger"
							>
								<Trash2Icon size={17} />
							</button>

						</div>
					</div>
				</article>
			))}


			{/* Sin noticias */}
			{!loading && announcements.length === 0 && (
				<p className="border-t border-neutral-200 py-xl text-sm text-neutral-500">
					{t('adminNews.noNews')}
				</p>
			)}

		</section>


		{/* Modal eliminar */}
		{deleteModalOpen && announcementToDelete && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]">

				<div className="w-full max-w-[430px] rounded-[20px] bg-white p-[28px] shadow-lg">

					<h2 className="m-0 font-heading text-[24px] font-bold text-heading">
						{t('adminNews.deleteModalTitle')}
					</h2>


					<p className="mt-[12px] font-body text-sm text-neutral-600">
						{t('adminNews.deleteModalMessage')}{' '}

						<span className="font-semibold">
							"{announcementToDelete.title}"
						</span>
					</p>


					{/* Botones del modal */}
					<div className="mt-[28px] flex justify-end gap-[12px]">

						<button
							type="button"
							onClick={() => {
								setDeleteModalOpen(false)
								setAnnouncementToDelete(null)
							}}
							className="rounded-full border border-neutral-300 px-[18px] py-[9px] font-body text-sm font-semibold text-heading"
						>
							{t('adminNews.deleteModalCancel')}
						</button>

						<button
							type="button"
							onClick={() => void confirmDelete()}
							className="rounded-full bg-red-500 px-[18px] py-[9px] font-body text-sm font-semibold text-white"
						>
							{t('adminNews.deleteModalConfirm')}
						</button>

					</div>
				</div>
			</div>
		)}

	</AdminLayout>
	);
}

export default AnnouncementsPage;
