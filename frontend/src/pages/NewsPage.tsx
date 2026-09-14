import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Container from "../components/home/Container";
import { useTranslation } from "react-i18next";
import NewsDetailModal from "../components/NewsDetailModal.tsx";

import { useAnnouncements } from "../hooks/useAnnouncements";
import { useAnnouncementImages } from "../hooks/useAnnouncementImages";
import type { Announcement, AnnouncementType } from "../types/announcement.ts";

import LowCortisol from "../assets/imgs/LowCortisol.png";

type NewsCategory = "All" | "NEWS" | "EVENT" | "NOTICE";

const TYPE_LABEL_KEY: Record<
  AnnouncementType,
  | "newspage.category2"
  | "newspage.category3"
  | "newspage.category4"
  | "newspage.category5"
> = {
  NEWS: "newspage.category2",
  EVENT: "newspage.category3",
  NOTICE: "newspage.category4",
  GENERAL: "newspage.category5",
};

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
  });
}

function NewsPage() {
  const { t, i18n } = useTranslation();
  const { announcements, loading, error, fetchAnnouncements } =
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
  const NEWS_PER_PAGE = 10;

  useEffect(() => {
    void fetchAnnouncements(i18n.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    void fetchImages(announcements.map((announcement) => announcement.id));
    // fetchImages is stable for the lifetime of this hook instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  //Filtra las noticias según la categoría seleccionada
  const realCards = announcements.filter(
    (a) => activeCategory === "All" || activeCategory === a.type,
  );

  //Calcula cuántas páginas se necesitan. Cada página puede mostrar un máximo de 10 noticias
  const totalPages = Math.ceil(realCards.length / NEWS_PER_PAGE);

  //Calcula desde cuál noticia debe comenzar la página actual
  const startIndex = (currentPage - 1) * NEWS_PER_PAGE;

  //Calcula hasta cuál noticia debe mostrar la página actual
  const endIndex = startIndex + NEWS_PER_PAGE;

  //Obtiene únicamente las noticias que corresponden a la página actual
  const cards: Announcement[] = realCards.slice(startIndex, endIndex);

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
      <section className="flex min-h-[360px] items-center bg-green-500 px-[30px] py-[60px] text-center text-white md:min-h-[420px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-white md:text-[46px]">
            {t("newspage.title")}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-white md:text-[15px]">
            {t("newspage.description")}
          </p>

          {/* Filtros */}
          <div className="mt-[24px] flex flex-wrap justify-center gap-[10px]">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "All" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category1")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NEWS")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "NEWS" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category2")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("EVENT")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "EVENT" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category3")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NOTICE")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "NOTICE" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category4")}
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Noticias */}
      <main>
        <Container className="py-[70px] md:py-[80px]">
          {(loading || imagesLoading) && (
            <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
              {t("common.loading")}
            </p>
          )}

          {(error || imagesError) && (
            <p className="m-0 p-xl text-center font-body text-base text-danger">
              {error || imagesError}
            </p>
          )}

          {!loading && !imagesLoading && !error && !imagesError && (
            <>
              <div className="flex flex-col gap-[18px]">
                {rows.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    className="grid grid-cols-1 gap-[18px] md:grid-cols-12"
                  >
                    {row.map((a, colIndex) => {
                      const isBig =
                        row.length === 1 ||
                        (rowIndex % 2 === 0 ? colIndex === 0 : colIndex === 1);

                      return isBig ? (
                        // Tarjeta grande
                        <article
                          key={a.id}
                          className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white md:col-span-8 md:grid md:h-[340px] md:grid-cols-12"
                        >
                          {/* Imagen */}
                          <div className="relative h-[240px] md:col-span-6 md:h-full">
                            {getCoverImage(a.id) ? (
                              <img
                                src={getCoverImage(a.id)}
                                alt={a.title}
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

                            <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                              {t(TYPE_LABEL_KEY[a.type])}
                            </span>
                          </div>

                          {/* Contenido */}
                          <div className="flex flex-col items-start p-[22px] text-left md:col-span-6">
                            <span className="font-body text-[11px] text-neutral-500">
                              {formatDate(a.eventDate, i18n.language)}
                            </span>

                            <h2 className="mt-[10px] font-heading text-[28px] font-bold text-heading">
                              {a.title}
                            </h2>

                            <p className="mt-[14px] line-clamp-3 font-body text-[13px] leading-[1.6] text-body-text">
                              {a.content}
                            </p>

                            <button
                              type="button"
                              onClick={() => setSelectedAnnouncement(a)}
                              className="mt-[26px] w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500 transition hover:bg-pink-400 hover:text-white"
                            >
                              {t("newspage.readMore")}
                            </button>
                          </div>
                        </article>
                      ) : (
                        // Tarjeta pequeña
                        <article
                          key={a.id}
                          className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-4 md:flex md:h-[340px] md:flex-col"
                        >
                          {/* Imagen */}
                          <div className="relative h-[200px] md:h-[125px] md:shrink-0">
                            {getCoverImage(a.id) ? (
                              <img
                                src={getCoverImage(a.id)}
                                alt={a.title}
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

                            <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                              {t(TYPE_LABEL_KEY[a.type])}
                            </span>
                          </div>

                          {/* Contenido */}
                          <div className="flex flex-1 flex-col items-start p-[20px] text-left">
                            <span className="font-body text-[11px] text-neutral-500">
                              {formatDate(a.eventDate, i18n.language)}
                            </span>

                            <h2 className="mt-[8px] font-heading text-[28px] font-bold text-heading">
                              {a.title}
                            </h2>

                            <p className="mt-[2px] line-clamp-1 font-body text-[12px] leading-[1.55] text-body-text">
                              {a.content}
                            </p>

                            <button
                              type="button"
                              onClick={() => setSelectedAnnouncement(a)}
                              className="mt-auto w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500 transition hover:bg-pink-400 hover:text-white"
                            >
                              {t("newspage.readMore")}
                            </button>
                          </div>
                        </article>
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
                        className={`flex size-[38px] items-center justify-center rounded-full font-body text-[13px] transition ${
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
