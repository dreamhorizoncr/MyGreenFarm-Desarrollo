import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Container from "../components/home/Container";
import { useTranslation } from "react-i18next";
import NewsDetailModal from "../components/NewsDetailModal.tsx";
import BlobButton from "../components/ui/BlobButton.tsx";
import Skeleton from "../components/ui/Skeleton.tsx";

import { useAnnouncements } from "../hooks/useAnnouncements";
import { useAnnouncementImages } from "../hooks/useAnnouncementImages";
import type { Announcement, AnnouncementType } from "../types/announcement.ts";

import LowCortisol from "../assets/imgs/LowCortisol.png";

type NewsCategory = "All" | "NEWS" | "EVENT" | "NOTICE" | "TRANSPORT";

const TYPE_LABEL_KEY: Record<
  AnnouncementType,
  | "newspage.category2"
  | "newspage.category3"
  | "newspage.category4"
  | "newspage.category5"
  | "newspage.category6"
> = {
  NEWS: "newspage.category2",
  EVENT: "newspage.category3",
  NOTICE: "newspage.category4",
  GENERAL: "newspage.category5",
  TRANSPORT: "newspage.category6"
};

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
  });
}

interface NewsCardProps {
  big: boolean
  announcement?: Announcement
  typeLabel?: string
  formattedDate?: string
  coverImage?: string
  onReadMore?: () => void
  loading?: boolean
}

function NewsCard({ big, announcement, typeLabel, formattedDate, coverImage, onReadMore, loading = false }: Readonly<NewsCardProps>) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <article
        className={`relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow md:h-[340px] ${
          big ? "md:col-span-8" : "md:col-span-4"
        }`}
      >
        <div className="relative h-[240px] md:absolute md:inset-y-0 md:left-0 md:h-auto md:w-1/2">
          <Skeleton shape="rect" className="h-full w-full rounded-none" />
        </div>

        <div className="relative flex flex-col gap-sm p-[22px] text-left md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2 md:justify-center">
          <Skeleton shape="line" className="h-3 w-1/3" />
          <Skeleton shape="line" className="h-6 w-4/5" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />
          <Skeleton shape="pill" className="h-8 w-28" />
        </div>
      </article>
    );
  }

  if (big) {
    return (
      <article className="relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow transition hover:-translate-y-1 hover:shadow-lg md:col-span-8 md:h-[340px]">
        {/* Imagen */}
        <div className="relative h-[240px] md:absolute md:inset-y-0 md:left-0 md:h-auto md:w-1/2">
          {coverImage ? (
            <img
              src={coverImage}
              alt={announcement!.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-page">
              <img
                src={LowCortisol}
                alt=""
                className="h-[75%] w-[75%] object-contain"
              />
            </div>
          )}

          <span className="absolute left-[14px] top-[14px] rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
            {typeLabel}
          </span>
        </div>

        {/* Contenido */}
        <div className="relative flex flex-col items-start p-[22px] text-left md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2 md:pb-[60px]">
          <span className="font-body text-caption text-neutral-500">
            {formattedDate}
          </span>

          <h2 className="mt-[10px] line-clamp-2 font-heading text-[24px] font-bold text-heading">
            {announcement!.title}
          </h2>

          <p className="mt-[14px] line-clamp-3 font-body text-body-sm leading-[1.6] text-body-text">
            {announcement!.content}
          </p>

          <div className="mt-md md:absolute md:bottom-[22px] md:left-[22px]">
            <BlobButton
              onClick={onReadMore}
              className="h-11 w-fit px-lg font-body text-caption uppercase"
            >
              {t("newspage.readMore")}
            </BlobButton>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow transition hover:-translate-y-1 hover:shadow-lg md:col-span-4 md:h-[340px]">
      {/* Imagen */}
      <div className="relative h-[200px] md:absolute md:inset-x-0 md:top-0 md:h-[125px]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={announcement!.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-page">
            <img
              src={LowCortisol}
              alt=""
              className="h-[75%] w-[75%] object-contain"
            />
          </div>
        )}

        <span className="absolute left-[14px] top-[14px] rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
          {typeLabel}
        </span>
      </div>

      {/* Contenido */}
      <div className="relative flex flex-col items-start p-[20px] text-left md:absolute md:inset-x-0 md:bottom-0 md:top-[125px] md:pb-[56px]">
        <span className="font-body text-caption text-neutral-500">
          {formattedDate}
        </span>

        <h2 className="mt-[8px] line-clamp-1 font-heading text-[24px] font-bold text-heading">
          {announcement!.title}
        </h2>

        <p className="mt-[1px] line-clamp-2 font-body text-body-sm leading-[1.6] text-body-text">
          {announcement!.content}
        </p>

        <div className="mt-sm md:absolute md:bottom-[20px] md:left-[20px]">
          <BlobButton
            onClick={onReadMore}
            className="h-11 w-fit px-lg font-body text-caption uppercase"
          >
            {t("newspage.readMore")}
          </BlobButton>
        </div>
      </div>
    </article>
  )
}

function NewsPage() {
  const { t, i18n } = useTranslation();
  const { announcements,totalPages, loading, error, fetchAnnouncements } =
    useAnnouncements();
  const {
    loading: imagesLoading,
    error: imagesError,
    fetchImages,
    getCoverImage,
  } = useAnnouncementImages();
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("All");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchAnnouncements(i18n.language, currentPage -1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language,currentPage]);

  useEffect(() => {
    void fetchImages(announcements.map((announcement) => announcement.id));
    // fetchImages is stable for the lifetime of this hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  // Filtra las noticias de la página actual según la categoría seleccionada
const cards = announcements.filter(
  (a) => activeCategory === "All" || activeCategory === a.type,
);

  //Se guardan las noticias en filas para mostrarlas de dos en dos
  const rows: Announcement[][] = [];
  //Recorre las noticias de la página actual y las agrupa en filas de dos.
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2));
  }

  return (
    <div id="news-page" className="min-h-screen bg-bg-page">
      <Navbar />

      {/* Hero de Noticias */}
      <section data-scroll-bg="green" className="flex min-h-[280px] items-center bg-green-500 px-[30px] py-[40px] text-center text-white md:min-h-[320px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
            {t("newspage.title")}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-white md:text-body-sm">
            {t("newspage.description")}
          </p>

          {/* Filtros */}
          <div className="mt-[24px] flex flex-wrap justify-center gap-[10px]">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
                activeCategory === "All"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {t("newspage.category1")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NEWS")}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
                activeCategory === "NEWS"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {t("newspage.category2")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("EVENT")}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
                activeCategory === "EVENT"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {t("newspage.category3")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NOTICE")}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
                activeCategory === "NOTICE"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {t("newspage.category4")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("TRANSPORT")}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
                activeCategory === "TRANSPORT"
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {t("newspage.category6")}
</button>
          </div>
        </div>
      </section>

      {/* Sección de Noticias */}
      <main>
        <Container className="py-[45px] md:py-[55px]">
          {(loading || imagesLoading) && (
            <div className="flex flex-col gap-[18px]">
              {[0, 1].map((rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-1 gap-[18px] md:grid-cols-12">
                  <NewsCard big={rowIndex % 2 === 0} loading />
                  <NewsCard big={rowIndex % 2 !== 0} loading />
                </div>
              ))}
            </div>
          )}

          {(error || imagesError) && (
            <p className="m-0 p-xl text-center font-body text-body text-danger">
              {error || imagesError}
            </p>
          )}

          {!loading && !imagesLoading && !error && !imagesError && (
            <>
              <div className="flex flex-col gap-[18px]">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.map((a) => a.id).join('-')}
                    className="grid grid-cols-1 gap-[18px] md:grid-cols-12"
                  >
                    {row.map((a, colIndex) => {
                      const isBig =
                        row.length === 1 ||
                        (rowIndex % 2 === 0 ? colIndex === 0 : colIndex === 1);

                      return (
                        <NewsCard
                          key={a.id}
                          big={isBig}
                          announcement={a}
                          typeLabel={t(TYPE_LABEL_KEY[a.type])}
                          formattedDate={formatDate(a.eventDate, i18n.language)}
                          coverImage={getCoverImage(a.id)}
                          onReadMore={() => setSelectedAnnouncement(a)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-[45px] flex items-center justify-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-[18px] text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`flex size-[38px] items-center justify-center rounded-full font-body text-body-sm transition ${
                          currentPage === page
                            ? "bg-green-500 text-white"
                            : "border border-neutral-200 bg-white text-heading hover:border-green-500"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-[18px] text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </Container>
      </main>

      {/* Modal con el detalle completo de la noticia */}
      {selectedAnnouncement && (
        <NewsDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}

export default NewsPage;
