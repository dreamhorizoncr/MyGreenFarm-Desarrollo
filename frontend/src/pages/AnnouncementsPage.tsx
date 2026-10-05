import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  FileImageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "@animateicons/react/lucide";
import AdminLayout from "../layout/AdminLayout.tsx";
import Skeleton from "../components/ui/Skeleton.tsx";
import Pagination from "../components/ui/Pagination.tsx";
import Select from "../components/ui/Select.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";
import { useAnnouncements } from "../hooks/useAnnouncements.ts";
import { notify } from "../utils/notifications.ts";
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
  | "adminNews.typeTransport"
> = {
  NEWS: "adminNews.typeNews",
  EVENT: "adminNews.typeEvent",
  NOTICE: "adminNews.typeNotice",
  GENERAL: "adminNews.typeGeneral",
  TRANSPORT: "adminNews.typeTransport",
};

type AdminNewsCategory =
  | "All"
  | "NEWS"
  | "EVENT"
  | "NOTICE"
  | "GENERAL"
  | "TRANSPORT";

function NewsRowSkeleton() {
  return (
    <div className="border-t border-neutral-200 px-md py-lg">
      <Skeleton shape="line" className="h-3 w-24" />
      <Skeleton shape="line" className="mt-xs h-6 w-2/3" />
      <div className="mt-xs flex flex-col gap-2xs">
        <Skeleton shape="line" className="h-4 w-full" />
        <Skeleton shape="line" className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function AnnouncementsPage() {
  const {
    announcements,
    totalPages,
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
  const [activeCategory, setActiveCategory] =
    useState<AdminNewsCategory>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [images, setImages] = useState<AnnouncementImageResponse[]>([]);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);
  const [imageToDelete, setImageToDelete] =
    useState<AnnouncementImageResponse | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    void fetchAnnouncements(i18n.language, currentPage - 1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, currentPage]);

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

      notify.success({
        title: editing
          ? t("adminNews.updatedToastTitle")
          : t("adminNews.createdToastTitle"),
        description: editing
          ? t("adminNews.updatedToastDescription")
          : t("adminNews.createdToastDescription"),
      });

      closeForm();
    } catch {
      notify.error({
        title: t("adminNews.saveErrorToastTitle"),
        description: t("adminNews.saveErrorToastDescription"),
      });
    }
  };

  const handleDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await deleteAnnouncement(announcementToDelete.id);

      if (editing?.id === announcementToDelete.id) {
        closeForm();
      }

      notify.success({
        title: t("adminNews.deletedToastTitle"),
        description: t("adminNews.deletedToastDescription"),
      });
    } catch (err) {
      notify.error(t("adminNews.deleteErrorToastTitle"));
      throw err;
    }
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await deleteImage(imageToDelete.id);
      setImages((current) => current.filter((item) => item.id !== imageToDelete.id));
      notify.success(t("adminNews.imageDeletedToastTitle"));
    } catch (err) {
      notify.error(t("adminNews.imageDeleteErrorToastTitle"));
      throw err;
    }
  };

  const handleCategoryChange = (category: AdminNewsCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      activeCategory === "All" || announcement.type === activeCategory,
  );

  const idleSubmitLabel = editing
    ? t("adminNews.newssavechanges")
    : t("adminNews.newspublish");

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t("adminNews.title")}
          </h1>

          <p className="mt-2 font-body text-body text-neutral-500">
            {t("adminNews.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon size={18} aria-hidden="true" />
          {t("adminNews.addNews")}
        </button>
      </div>

      {error && (
        <p className="mt-lg rounded-xl bg-red-50 p-md text-body-sm text-red-700">
          {error}
        </p>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("adminNews.newscancel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={closeForm}
          />

          <form
            onSubmit={handleSubmit}
            className="relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl"
          >
            <div className="flex items-center justify-between gap-md">
              <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {editing ? t("adminNews.editNews") : t("adminNews.newnews")}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar formulario"
                className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-(--grey-100)"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="mt-lg grid gap-md md:grid-cols-2">
              <label className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newsTitle")}

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

              <label className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newstype")}

                <div className="mt-xs">
                  <Select
                    value={form.type}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        type: value as AnnouncementType,
                      })
                    }
                    options={Object.entries(typeLabels).map(([value, label]) => ({
                      value,
                      label: t(label),
                    }))}
                    aria-label={t("adminNews.newstype")}
                  />
                </div>
              </label>

              <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("adminNews.newscontent")}

                <textarea
                  required
                  minLength={20}
                  maxLength={4000}
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

              <label className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newslocation")}

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

              <label className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newsdate")}

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

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("adminNews.newscover")}</span>

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
                  className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
                >
                  <FileImageIcon size={17} aria-hidden="true" />
                  {t("adminNews.chooseCover")}
                </button>

                {cover && (
                  <p className="mt-xs text-caption font-normal text-neutral-500">
                    {cover.name}
                  </p>
                )}
              </div>

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("adminNews.newsgaleryimages")}</span>

                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                  onChange={(e) =>
                    setGallery(Array.from(e.target.files ?? []).slice(0, 4))
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
                >
                  <FileImageIcon size={17} aria-hidden="true" />
                  {t("adminNews.newschooseimages")}
                </button>

                {gallery.length > 0 && (
                  <p className="mt-xs text-caption font-normal text-neutral-500">
                    {gallery.length} archivo(s) seleccionado(s)
                  </p>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <div className="mt-lg">
                <h3 className="font-body text-body-sm font-semibold text-heading">
                  {t("adminNews.newsactualimage")}
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

                      <span className="text-caption text-neutral-500">
                        {image.isCover
                          ? t("adminNews.newscover")
                          : t("adminNews.newsgallery")}
                      </span>

                      <button
                        type="button"
                        onClick={() => setImageToDelete(image)}
                        aria-label={t("adminNews.deleteImage")}
                        className="rounded-full p-2xs text-danger transition-colors hover:bg-red-50"
                      >
                        <Trash2Icon size={16} />
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
                className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
              >
                {t("adminNews.newscancel")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                {loading ? t("adminNews.newssaving") : idleSubmitLabel}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-xl flex flex-wrap gap-sm">
        <button
          type="button"
          onClick={() => handleCategoryChange("All")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "All"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.filterAll")}
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("NEWS")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "NEWS"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.typeNews")}
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("EVENT")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "EVENT"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.typeEvent")}
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("NOTICE")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "NOTICE"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.typeNotice")}
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("GENERAL")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "GENERAL"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.typeGeneral")}
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange("TRANSPORT")}
          className={`rounded-full border px-md py-xs font-body text-body-sm transition ${
            activeCategory === "TRANSPORT"
              ? "border-green-500 bg-green-500 text-white"
              : "border-green-500 bg-white text-heading hover:bg-green-50"
          }`}
        >
          {t("adminNews.typeTransport")}
        </button>
      </div>

      <section className="mt-xl grid gap-md">
        {loading && !formOpen && (
          <output className="contents" aria-label={t("adminNews.newsload")}>
            <NewsRowSkeleton />
            <NewsRowSkeleton />
            <NewsRowSkeleton />
          </output>
        )}

        {filteredAnnouncements.map((announcement) => (
          <article
            key={announcement.id}
            className="border-t border-neutral-200 px-md py-lg transition-colors hover:bg-neutral-50"
          >
            <div className="flex flex-col gap-md">
              <div>
                <span className="inline-flex rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
                  {t(typeLabels[announcement.type])}
                </span>

                <h2 className="mt-xs font-heading text-xl font-bold text-heading">
                  {announcement.title}
                </h2>

                <p className="mt-xs whitespace-pre-line text-body-sm text-neutral-600">
                  {announcement.content}
                </p>

                {(announcement.location || announcement.eventDate) && (
                  <p className="mt-sm text-caption text-neutral-500">
                    {announcement.location}

                    {announcement.location && announcement.eventDate
                      ? " · "
                      : ""}

                    {announcement.eventDate
                      ? new Date(announcement.eventDate).toLocaleString()
                      : ""}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void openEdit(announcement)}
                  aria-label={t("adminNews.editButton")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 text-green-500 transition"
                >
                  <PencilIcon size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(announcement)}
                  aria-label={t("adminNews.deleteButton")}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300 text-danger transition"
                >
                  <Trash2Icon size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && announcements.length === 0 && (
          <p className="border-t border-neutral-200 py-xl text-body-sm text-neutral-500">
            {t("adminNews.noNews")}
          </p>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {announcementToDelete && (
        <DeleteConfirmModal
          title={t("adminNews.deleteModalTitle")}
          message={t("adminNews.deleteConfirmMessage", { title: announcementToDelete.title })}
          onConfirm={confirmDelete}
          onClose={() => setAnnouncementToDelete(null)}
        />
      )}

      {imageToDelete && (
        <DeleteConfirmModal
          title={t("adminNews.deleteImageModalTitle")}
          message={t("adminNews.deleteImageModalMessage")}
          onConfirm={confirmDeleteImage}
          onClose={() => setImageToDelete(null)}
        />
      )}
    </AdminLayout>
  );
}

export default AnnouncementsPage;
