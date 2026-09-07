import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Container from "../components/home/Container";
import { useTranslation } from "react-i18next";

import { useAnnouncements } from "../hooks/useAnnouncements";
import type { Announcement, AnnouncementType } from "../types/announcement.ts";

import news1 from "../assets/imgs/news1.png";
import news2 from "../assets/imgs/news2.png";
import news3 from "../assets/imgs/news3.png";
import news4 from "../assets/imgs/news4.png";

// import Footer from '../layout/Footer'

type NewsCategory = "All" | "NEWS" | "EVENT" | "NOTICE";

const TYPE_LABEL_KEY: Record<AnnouncementType, "newspage.category2" | "newspage.category3" | "newspage.category4" | "newspage.category5"> = {
  NEWS: "newspage.category2",
  EVENT: "newspage.category3",
  NOTICE: "newspage.category4",
  GENERAL: "newspage.category5",
};

const CARD_IMAGES = [news1, news2, news3, news4];

const MIN_CARDS = 4;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const STATIC_ANNOUNCEMENTS: Announcement[] = [
  { id: "static-1", title: "Evento 1", content: LOREM, type: "GENERAL", eventDate: "2026-10-18T12:00:00", location: null },
  { id: "static-2", title: "Evento 2", content: LOREM, type: "EVENT", eventDate: "2026-01-08T12:00:00", location: null },
  { id: "static-3", title: "Evento Académico", content: LOREM, type: "NEWS", eventDate: "2026-01-06T12:00:00", location: null },
  { id: "static-4", title: "Evento 1", content: LOREM, type: "NOTICE", eventDate: "2026-10-30T12:00:00", location: null },
];

function formatDate(iso: string | null, lang: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "long" });
}

function NewsPage() {
  const { t, i18n } = useTranslation();
  const {announcements, loading, error, fetchAnnouncements} = useAnnouncements();
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("All");

  useEffect(() => {
    fetchAnnouncements(i18n.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const realCards = announcements.filter(
    (a) => activeCategory === "All" || activeCategory === a.type
  );

  const staticCards = STATIC_ANNOUNCEMENTS.filter(
    (a) => activeCategory === "All" || activeCategory === a.type
  );

  const cards: Announcement[] = [
    ...realCards,
    ...staticCards.slice(0, Math.max(0, MIN_CARDS - realCards.length)),
  ];

  const rows: Announcement[][] = [];
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
                activeCategory === "NEWS"
                  ? "bg-orange-500"
                  : "bg-orange-400"
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
                activeCategory === "NOTICE"
                  ? "bg-orange-500"
                  : "bg-orange-400"
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
        {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t("common.loading")}</p>}

        {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-[18px]">
            {rows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid grid-cols-1 gap-[18px] md:grid-cols-12">
                {row.map((a, colIndex) => {
                  const globalIndex = rowIndex * 2 + colIndex;
                  const isBig = row.length === 1 || (rowIndex % 2 === 0 ? colIndex === 0 : colIndex === 1);

                  return isBig ? (
                    <article
                      key={a.id}
                      className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-8 md:grid md:h-[340px] md:grid-cols-12"
                    >
                      {/* Imagen */}
                      <div className="relative h-[240px] md:col-span-6 md:h-full">
                        <img
                          src={CARD_IMAGES[globalIndex % CARD_IMAGES.length]}
                          alt={a.title}
                          className="h-full w-full object-cover"
                        />

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

                        <p className="mt-[14px] font-body text-[13px] leading-[1.6] text-body-text">
                          {a.content}
                        </p>

                        <button
                          type="button"
                          className="mt-[26px] w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                        >
                          Leer más
                        </button>
                      </div>
                    </article>
                  ) : (
                    <article
                      key={a.id}
                      className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-4 md:flex md:h-[340px] md:flex-col"
                    >
                      <div className="relative h-[200px] md:h-[125px] md:shrink-0">
                        <img
                          src={CARD_IMAGES[globalIndex % CARD_IMAGES.length]}
                          alt={a.title}
                          className="h-full w-full object-cover"
                        />

                        <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                          {t(TYPE_LABEL_KEY[a.type])}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col items-start p-[20px] text-left">
                        <span className="font-body text-[11px] text-neutral-500">
                          {formatDate(a.eventDate, i18n.language)}
                        </span>

                        <h2 className="mt-[8px] font-heading text-[28px] font-bold text-heading">
                          {a.title}
                        </h2>

                        <p className="mt-[2px] font-body text-[12px] leading-[1.55] text-body-text">
                          {a.content}
                        </p>

                        <button
                          type="button"
                          className="mt-auto w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                        >
                          Leer más
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        </Container>
      </main>
    </div>
  );
}

export default NewsPage;