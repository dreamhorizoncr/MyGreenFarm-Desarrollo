import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
} from "@animateicons/react/lucide";
import AdminLayout from "../layout/AdminLayout.tsx";
import SkeletonList from "../components/ui/SkeletonList.tsx";
import Pagination from "../components/ui/Pagination.tsx";
import Select from "../components/ui/Select.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";
import { useAnnouncements } from "../hooks/useAnnouncements.ts";
import { useModalExit } from "../hooks/useModalExit.ts";
import { useSkeletonCount } from "../hooks/useSkeletonCount.ts";
import { notify } from "../utils/notifications.ts";
import { validateMinLength, validateRequired, validateSafeText } from "../utils/validators.ts";
import type {
  Announcement,
  AnnouncementImageResponse,
  AnnouncementRequest,
  AnnouncementType,
} from "../types/announcement.ts";
import NewsDetailModal from "../components/NewsDetailModal.tsx";
import NewsCard from "../components/NewsCard.tsx";
import { formatNewsDate } from "../utils/newsDate.ts";
import { useAnnouncementImages } from "../hooks/useAnnouncementImages.ts";
import DatePickerField from "../components/ui/DatePickerField.tsx";
import TimePickerField from "../components/ui/TimePickerField.tsx";
import CardActionButton from "../components/ui/CardActionButton.tsx";
import ImagePickerButton from "../components/ui/ImagePickerButton.tsx";
import ImageThumb, { ImageThumbList } from "../components/ui/ImageThumb.tsx";
import ModalCloseButton from "../components/ui/ModalCloseButton.tsx";

const emptyForm: AnnouncementRequest = {
  title: "",
  content: "",
  type: "NEWS",
  eventDate: "",
  location: "",
};

const TITLE_MIN_LENGTH = 5;
const CONTENT_MIN_LENGTH = 20;

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
  const [previewing, setPreviewing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<AnnouncementRequest>(emptyForm);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
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
  const { t, i18n } = useTranslation();

  useEffect(() => {
    void fetchAnnouncements(i18n.language, currentPage - 1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, currentPage]);

  const { loading: coversLoading, fetchImages: fetchCovers, getCoverImage } = useAnnouncementImages();

  useEffect(() => {
    void fetchCovers(announcements.map((announcement) => announcement.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setTitleError(null);
    setContentError(null);
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
    setTitleError(null);
    setContentError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setTitleError(null);
    setContentError(null);
    setImages([]);
  };

  const { closing: formClosing, requestClose } = useModalExit(closeForm);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const titleErrorMessage =
      validateRequired(form.title, t("adminNews.newsTitle"), t) ??
      validateMinLength(form.title, TITLE_MIN_LENGTH, t) ??
      validateSafeText(form.title, t);
    const contentErrorMessage =
      validateRequired(form.content, t("adminNews.newscontent"), t) ??
      validateMinLength(form.content, CONTENT_MIN_LENGTH, t) ??
      validateSafeText(form.content, t);
    const locationErrorMessage = validateSafeText(form.location, t);

    setTitleError(titleErrorMessage);
    setContentError(contentErrorMessage);
    setLocationError(locationErrorMessage);

    if (titleErrorMessage || contentErrorMessage || locationErrorMessage) return;

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

      requestClose();
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
        requestClose();
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
  const listLoading = loading || coversLoading;
  const skeletonCount = useSkeletonCount("admin-news", listLoading, filteredAnnouncements.length);

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
          className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("adminNews.newscancel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={requestClose}
          />

          <form
            onSubmit={handleSubmit}
            className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${formClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
          >
            <div className="flex items-center justify-between gap-md">
              <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {editing ? t("adminNews.editNews") : t("adminNews.newnews")}
              </h2>

              <ModalCloseButton
                onClick={requestClose}
                aria-label={t("common.closeForm")}
              />
            </div>

            <div className="mt-lg grid gap-md md:grid-cols-2">
              <label className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newsTitle")}

                <input
                  value={form.title}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      title: e.target.value,
                    });
                    if (titleError) setTitleError(null);
                  }}
                  maxLength={70}
                  className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
                {titleError && (
                  <span className="mt-xs block font-body text-body-sm font-normal text-danger">{titleError}</span>
                )}
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
                  rows={6}
                  value={form.content}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      content: e.target.value,
                    });
                    if (contentError) setContentError(null);
                  }}
                  maxLength={4000}
                  className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {contentError && (
                  <span className="mt-xs block font-body text-body-sm font-normal text-danger">{contentError}</span>
                )}
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
                {locationError && (
                  <span className="mt-xs block font-body text-body-sm font-normal text-danger">{locationError}</span>
                )}
              </label>

              <div className="font-body text-body-sm font-semibold text-heading">
                {t("adminNews.newsdate")}

                <div className="flex gap-sm">
                  <div className="min-w-0 flex-1">
                    <DatePickerField
                      value={(form.eventDate ?? "").slice(0, 10)}
                      onChange={(date) =>
                        setForm({
                          ...form,
                          eventDate: date ? `${date}T${(form.eventDate ?? "").slice(11, 16) || "00:00"}` : "",
                        })
                      }
                      ariaLabel={t("adminNews.newsdate")}
                    />
                  </div>
                  <div className="w-[150px] shrink-0">
                    <TimePickerField
                      value={(form.eventDate ?? "").slice(11, 16)}
                      disabled={!form.eventDate}
                      onChange={(time) =>
                        setForm({
                          ...form,
                          eventDate: `${(form.eventDate ?? "").slice(0, 10)}T${time}`,
                        })
                      }
                      ariaLabel={t("adminNews.newsdate")}
                    />
                  </div>
                </div>
              </div>

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("adminNews.newscover")}</span>

                <ImagePickerButton
                  label={t("adminNews.chooseCover")}
                  replacesCurrent={images.some((image) => image.isCover)}
                  accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                  onSelect={(files) => setCover(files[0] ?? null)}
                />

                {cover && (
                  <ImageThumbList className="mt-sm">
                    <ImageThumb file={cover} label={cover.name} onDelete={() => setCover(null)} deleteLabel={t("adminNews.deleteImage")} />
                  </ImageThumbList>
                )}
              </div>

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("adminNews.newsgaleryimages")}</span>

                <ImagePickerButton
                  label={t("adminNews.newschooseimages")}
                  limit={4}
                  accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                  multiple
                  onSelect={(files) => setGallery(files.slice(0, 4))}
                />

                {gallery.length > 0 && (
                  <ImageThumbList className="mt-sm">
                    {gallery.map((file, index) => (
                      <ImageThumb
                        key={`${file.name}-${index}`}
                        file={file}
                        label={file.name}
                        onDelete={() => setGallery((current) => current.filter((_, i) => i !== index))}
                        deleteLabel={t("adminNews.deleteImage")}
                      />
                    ))}
                  </ImageThumbList>
                )}
              </div>
            </div>

            {images.length > 0 && (
              <ImageThumbList title={t("adminNews.newsactualimage")}>
                {images.map((image) => (
                  <ImageThumb
                    key={image.id}
                    src={image.fileUrl}
                    label={image.isCover ? t("adminNews.newscover") : t("adminNews.newsgallery")}
                    onDelete={() => setImageToDelete(image)}
                    deleteLabel={t("adminNews.deleteImage")}
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

      <section className="mt-xl grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-3">
        {listLoading && !formOpen && (
          <output className="contents" aria-label={t("adminNews.newsload")}>
            <SkeletonList count={skeletonCount}>{() => <NewsCard loading actions={null} previewLinkLabel="" />}</SkeletonList>
          </output>
        )}

        {!listLoading && filteredAnnouncements.map((announcement) => (
          <NewsCard
            key={announcement.id}
            announcement={announcement}
            typeLabel={t(typeLabels[announcement.type])}
            formattedDate={formatNewsDate(announcement.eventDate, i18n.language)}
            coverImage={getCoverImage(announcement.id)}
            onReadMore={() => setPreviewing(announcement)}
            previewLinkLabel={t("adminNews.preview")}
            actions={
              <>
                <CardActionButton action="edit" label={t("adminNews.editButton")} onClick={() => void openEdit(announcement)} />
                <CardActionButton action="delete" label={t("adminNews.deleteButton")} onClick={() => handleDelete(announcement)} />
              </>
            }
          />
        ))}

        {!listLoading && announcements.length === 0 && (
          <p className="col-span-full border-t border-neutral-200 py-xl text-body-sm text-neutral-500">
            {t("adminNews.noNews")}
          </p>
        )}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

        {/* Vista previa */}
      {previewing && (
        <NewsDetailModal
          announcement={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}

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
