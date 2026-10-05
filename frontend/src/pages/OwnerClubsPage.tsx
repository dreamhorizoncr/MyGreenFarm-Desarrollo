import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ClockIcon,
  FileImageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "@animateicons/react/lucide";
import AdminLayout from "../layout/AdminLayout.tsx";
import Skeleton from "../components/ui/Skeleton.tsx";
import { clubService, type TranslationItem } from "../services/clubs.ts";
import { notify } from "../utils/notifications.ts";
import type {
  ClubRequest,
  ClubResponse,
  ClubImageResponse,
} from "../types/clubs.ts";

const emptyForm: ClubRequest = {
  name: "",
  description: "",
  schedule: "",
  maxCapacity: undefined,
};

function ClubCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
      <Skeleton shape="rect" className="h-[180px] w-full" />
      <div className="flex flex-1 flex-col gap-sm p-lg">
        <Skeleton shape="line" className="h-6 w-3/4" />
        <Skeleton shape="line" className="h-4 w-full" />
        <Skeleton shape="line" className="h-4 w-2/3" />
        <div className="mt-auto flex justify-end gap-sm pt-sm">
          <Skeleton shape="circle" className="h-10 w-10" />
          <Skeleton shape="circle" className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

function OwnerClubsPage() {
  const { t: translate, i18n } = useTranslation();
  const translateKey = translate as (key: string) => string;
  const t = (key: string): string =>
    translateKey(key.startsWith("admin.") ? key : `admin.${key}`);

  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClubResponse | null>(null);
  const [form, setForm] = useState<ClubRequest>(emptyForm);

  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ClubImageResponse[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<ClubResponse | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const editImagesClubIdRef = useRef<number | null>(null);
  const sourceClubsRef = useRef(new Map<number, Pick<ClubResponse, "name" | "description" | "schedule">>());

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clubService.getAll({ lang: i18n.language, size: 50 });

      let clubsWithImages = await Promise.all(
        data.content.map(async (club) => {
          try {
            let imgs = club.images;
            if (!imgs || imgs.length === 0) {
              imgs = await clubService.getImagesByClub(club.id);
            }
            const coverImg = imgs.find((img) => img.isCover) ?? imgs[0];
            return {
              ...club,
              images: imgs,
              coverImageUrl: coverImg?.fileUrl ?? club.coverImageUrl,
            };
          } catch {
            return club;
          }
        })
      );

      sourceClubsRef.current = new Map(
        clubsWithImages.map((club) => [club.id, {
          name: club.name,
          description: club.description,
          schedule: club.schedule,
        }])
      );

      const currentLang = i18n.language?.split("-")[0] || "es";
      if (currentLang !== "es" && clubsWithImages.length > 0) {
        const translationItems: TranslationItem[] = clubsWithImages.flatMap((club) => [
          { entityId: String(club.id), fieldName: "name", originalText: club.name },
          { entityId: String(club.id), fieldName: "description", originalText: club.description },
          ...(club.schedule
            ? [{ entityId: String(club.id), fieldName: "schedule", originalText: club.schedule }]
            : []),
        ]);

        try {
          const translations = await clubService.translateBatch("club", currentLang, translationItems);
          clubsWithImages = clubsWithImages.map((club) => ({
            ...club,
            name: translations[`${club.id}:name`] ?? club.name,
            description: translations[`${club.id}:description`] ?? club.description,
            schedule: club.schedule
              ? translations[`${club.id}:schedule`] ?? club.schedule
              : club.schedule,
          }));
        } catch (translationError) {
          console.error("No se pudieron traducir los clubs:", translationError);
        }
      }

      setClubs(clubsWithImages);
    } catch (err) {
      console.error(err);
      setError(t("admin.ownerClubs.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchClubs();
  }, [i18n.language]);

  const openCreate = () => {
    editImagesClubIdRef.current = null;
    setEditing(null);
    setForm(emptyForm);
    setCover(null);
    setGallery([]);
    setExistingImages([]);
    setFormOpen(true);
  };

  const openEdit = (club: ClubResponse) => {
    const sourceClub = sourceClubsRef.current.get(club.id) ?? club;
    editImagesClubIdRef.current = club.id;
    setEditing(club);
    setForm({
      name: sourceClub.name,
      description: sourceClub.description,
      schedule: sourceClub.schedule ?? "",
      maxCapacity: club.maxCapacity,
    });
    setCover(null);
    setGallery([]);
    setExistingImages(club.images ?? []);
    setFormOpen(true);

    if (!club.images?.length) {
      void clubService.getImagesByClub(club.id).then((images) => {
        if (editImagesClubIdRef.current === club.id) {
          setExistingImages(images);
        }
      }).catch((err: unknown) => {
        console.error(err);
      });
    }
  };

  const closeForm = () => {
    editImagesClubIdRef.current = null;
    setFormOpen(false);
    setEditing(null);
    setExistingImages([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dataToSend: ClubRequest = {
      name: form.name,
      description: form.description,
      schedule: form.schedule?.trim() || undefined,
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
    };

    try {
      let savedClub: ClubResponse;

      if (editing) {
        savedClub = await clubService.update(editing.id, dataToSend);

        if (cover) {
          await clubService.uploadImages(savedClub.id, [cover], true);
        }
        if (gallery.length > 0) {
          await clubService.uploadImages(savedClub.id, gallery, false);
        }
      } else {
        savedClub = await clubService.createWithImages(
          dataToSend,
          cover || undefined,
          gallery.length > 0 ? gallery : undefined
        );
      }

      notify.success({
        title: editing
          ? t("ownerClubs.updatedToastTitle")
          : t("ownerClubs.createdToastTitle"),
        description: editing
          ? t("ownerClubs.updatedToastDescription")
          : t("ownerClubs.createdToastDescription"),
      });

      closeForm();
      await fetchClubs();
    } catch (err) {
      console.error(err);
      notify.error({
        title: t("ownerClubs.saveErrorToastTitle"),
        description: t("ownerClubs.saveErrorToastDescription"),
      });
    }
  };

  const handleDelete = (club: ClubResponse) => {
    setClubToDelete(club);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clubToDelete) return;

    try {
      await clubService.delete(clubToDelete.id);

      if (editing?.id === clubToDelete.id) {
        closeForm();
      }

      notify.success({
        title: t("ownerClubs.deletedToastTitle"),
        description: t("ownerClubs.deletedToastDescription"),
      });

      setDeleteModalOpen(false);
      setClubToDelete(null);
      await fetchClubs();
    } catch (err) {
      console.error(err);
      notify.error(t("ownerClubs.deleteErrorToastTitle"));
    }
  };

  const handleDeleteImage = async (image: ClubImageResponse) => {
    try {
      await clubService.deleteImage(image.id);
      setExistingImages((current) => current.filter((item) => item.id !== image.id));
      notify.success(t("ownerClubs.imageDeletedToastTitle"));
    } catch (err) {
      console.error(err);
      notify.error(t("ownerClubs.imageDeleteErrorToastTitle"));
    }
  };

  const idleSubmitLabel = editing
    ? t("ownerClubs.saveChanges")
    : t("ownerClubs.publish");

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t("ownerClubs.title")}
          </h1>

          <p className="mt-2 font-body text-body text-neutral-500">
            {t("ownerClubs.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon size={18} aria-hidden="true" />
          {t("ownerClubs.addClub")}
        </button>
      </div>

      {error && (
        <p className="mt-lg rounded-xl bg-red-50 p-md text-body-sm text-red-700">
          {error}
        </p>
      )}

      {/* Grid de Cards de Clubes */}
      <section className="mt-xl grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {loading && !formOpen && (
          <output className="contents">
            <ClubCardSkeleton />
            <ClubCardSkeleton />
            <ClubCardSkeleton />
          </output>
        )}

        {!loading &&
          clubs.map((club) => (
            <article
              key={club.id}
              className="flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition hover:-translate-y-1 shadow-sm"
            >
              {/* Cover Image */}
              <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
                {club.coverImageUrl ? (
                  <img
                    src={club.coverImageUrl}
                    alt={club.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-body text-body-sm text-neutral-400">
                      {t("ownerClubs.coverImage")}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col gap-sm px-lg pb-lg pt-md">
                <div className="flex items-start justify-between gap-sm">
                  <h3 className="m-0 min-w-0 flex-1 text-left font-heading text-h4 font-bold text-green-500 line-clamp-2">
                    {club.name}
                  </h3>
                  {club.maxCapacity && (
                    <span className="w-fit shrink-0 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white flex items-center gap-1">
                      <UsersIcon size={12} />
                      {club.maxCapacity} {t("ownerClubs.capacityLabel")}
                    </span>
                  )}
                </div>

                <p className="m-0 min-h-[48px] text-left font-body text-body-sm leading-relaxed text-neutral-600 line-clamp-2">
                  {club.description}
                </p>

                <div className="my-1 border-t border-neutral-200" />

                {/* Detalles: Horario y Capacidad */}
                <div className="space-y-2xs pt-xs text-left">
                  {club.schedule && (
                    <div className="font-body text-body-sm leading-relaxed text-neutral-500">
                      <div className="flex items-center gap-2">
                        <ClockIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                        <span className="font-semibold text-neutral-600">
                          {t("ownerClubs.schedule")}
                        </span>
                      </div>
                      <p className="m-0 mt-2xs px-1 text-left text-body-sm">{club.schedule}</p>
                    </div>
                  )}

                  {club.maxCapacity && (
                    <div className="font-body text-body-sm leading-relaxed text-neutral-500">
                      <div className="flex items-center gap-2">
                        <UsersIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                        <span className="font-semibold text-neutral-600">
                          {t("ownerClubs.maxCapacity")}
                        </span>
                      </div>
                      <p className="m-0 mt-2xs px-1 text-left text-body-sm">
                        {club.maxCapacity} {t("ownerClubs.capacityUnit")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="mt-auto flex justify-end gap-sm pt-sm">
                  <button
                    type="button"
                    onClick={() => void openEdit(club)}
                    aria-label={t("ownerClubs.editClub")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 text-green-500 transition hover:bg-green-50"
                  >
                    <PencilIcon size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(club)}
                    aria-label={t("ownerClubs.deleteModalTitle")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2Icon size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </section>

      {!loading && clubs.length === 0 && (
        <p className="py-xl text-center font-body text-body-sm text-neutral-500">
          {t("ownerClubs.noClubs")}
        </p>
      )}

      {/* Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("ownerClubs.cancel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={closeForm}
          />

          <form
            onSubmit={handleSubmit}
            className="relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-[820px] overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl"
          >
            <div className="flex items-center justify-between gap-md">
              <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {editing
                  ? t("ownerClubs.editClub")
                  : t("ownerClubs.newClub")}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar formulario"
                className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="mt-lg grid gap-md md:grid-cols-2">
              <label className="font-body text-body-sm font-semibold text-heading">
                {t("ownerClubs.clubName")}
                <input
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("ownerClubs.clubNamePlaceholder")}
                  className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
              </label>

              <label className="font-body text-body-sm font-semibold text-heading">
                {t("ownerClubs.maxCapacity")}
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.maxCapacity ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxCapacity: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder={t("ownerClubs.capacityPlaceholder")}
                  className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
              </label>

              <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("ownerClubs.descriptionLabel")}
                <textarea
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("ownerClubs.descriptionPlaceholder")}
                  className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
              </label>

              <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("ownerClubs.schedule")}
                <input
                  value={form.schedule ?? ""}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder={t("ownerClubs.schedulePlaceholder")}
                  className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
              </label>

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("ownerClubs.coverImage")}</span>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
                >
                  <FileImageIcon size={17} aria-hidden="true" />
                  {t("ownerClubs.chooseCover")}
                </button>

                {cover && (
                  <p className="mt-xs text-caption font-normal text-neutral-500">
                    {cover.name}
                  </p>
                )}
              </div>

              <div className="font-body text-body-sm font-semibold text-heading">
                <span className="block">{t("ownerClubs.galleryImages")}</span>

                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpg,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) =>
                    setGallery(Array.from(e.target.files ?? []).slice(0, 6))
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="mt-xs inline-flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
                >
                  <FileImageIcon size={17} aria-hidden="true" />
                  {t("ownerClubs.chooseGallery")}
                </button>

                {gallery.length > 0 && (
                  <p className="mt-xs text-caption font-normal text-neutral-500">
                    {gallery.length} archivo(s) seleccionado(s)
                  </p>
                )}
              </div>
            </div>

            {existingImages.length > 0 && (
              <div className="mt-lg">
                <h3 className="font-body text-body-sm font-semibold text-heading">
                  {t("ownerClubs.actualImages")}
                </h3>

                <div className="mt-sm flex flex-wrap gap-md">
                  {existingImages.map((image) => (
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
                          ? t("ownerClubs.coverTag")
                          : t("ownerClubs.galleryTag")}
                      </span>

                      <button
                        type="button"
                        onClick={() => void handleDeleteImage(image)}
                        aria-label={t("ownerClubs.deleteImage")}
                        className="rounded-full p-2xs text-red-500 transition-colors hover:bg-red-50"
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
                {t("ownerClubs.cancel")}
              </button>

              <button
                type="submit"
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                {idleSubmitLabel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteModalOpen && clubToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]">
          <div className="w-full max-w-[430px] rounded-[20px] bg-white p-[28px] shadow-lg">
            <h2 className="m-0 font-heading text-[24px] font-bold text-heading">
              {t("ownerClubs.deleteModalTitle")}
            </h2>

            <p className="mt-[12px] font-body text-body-sm text-neutral-600">
              {t("ownerClubs.deleteModalMessage")}{" "}
              <span className="font-semibold">"{clubToDelete.name}"</span>?
            </p>

            <div className="mt-[28px] flex justify-end gap-[12px]">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setClubToDelete(null);
                }}
                className="rounded-full border border-neutral-300 px-[18px] py-[9px] font-body text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
              >
                {t("ownerClubs.deleteModalCancel")}
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-full bg-red-500 px-[18px] py-[9px] font-body text-body-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                {t("ownerClubs.deleteModalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default OwnerClubsPage;