import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Container from "../components/home/Container";
import { useTranslation } from "react-i18next";
import NewsDetailModal from "../components/NewsDetailModal.tsx";
import NewsCard from "../components/NewsCard.tsx";
import { formatNewsDate } from "../utils/newsDate.ts";
import SkeletonList from "../components/ui/SkeletonList.tsx";
import { useSkeletonCount } from "../hooks/useSkeletonCount.ts";
import Pagination from "../components/ui/Pagination.tsx";

import { useAnnouncements } from "../hooks/useAnnouncements";
import { useAnnouncementImages } from "../hooks/useAnnouncementImages";
import type { Announcement, AnnouncementType } from "../types/announcement.ts";
import TabHighlight from "../components/ui/TabHighlight.tsx";


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

const cards = announcements.filter(
  (a) => activeCategory === "All" || activeCategory === a.type,
);

  const rows: Announcement[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2));
  }

  const skeletonCount = useSkeletonCount("news", loading || imagesLoading, cards.length, 4);
  const skeletonRows = Math.ceil(skeletonCount / 2);

  return (
    <div id="news-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section data-scroll-bg="green" className="flex min-h-[280px] items-start bg-green-500 px-[30px] pt-[48px] pb-[40px] text-center text-white md:min-h-[320px] md:pt-[72px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
            {t("newspage.title")}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-white md:text-body-sm">
            {t("newspage.description")}
          </p>

          <div className="isolate mt-[24px] flex flex-wrap justify-center gap-[10px]">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "All"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "All" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category1")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NEWS")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "NEWS"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "NEWS" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category2")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("EVENT")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "EVENT"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "EVENT" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category3")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("NOTICE")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "NOTICE"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "NOTICE" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category4")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("TRANSPORT")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "TRANSPORT"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "TRANSPORT" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category6")}
</button>
          </div>
        </div>
      </section>

      <main>
        <Container className="py-10 md:py-12">
          {(loading || imagesLoading) && (
            <div className="flex flex-col gap-[18px]">
              <SkeletonList count={skeletonRows}>{(rowIndex) => {
                const cardsInRow = Math.min(2, skeletonCount - rowIndex * 2);
                return (
                  <div className="grid grid-cols-1 gap-[18px] md:grid-cols-12">
                    <NewsCard big={cardsInRow === 1 || rowIndex % 2 === 0} loading className={cardsInRow === 1 || rowIndex % 2 === 0 ? "md:col-span-8" : "md:col-span-4"} />
                    {cardsInRow === 2 && <NewsCard big={rowIndex % 2 !== 0} loading className={rowIndex % 2 !== 0 ? "md:col-span-8" : "md:col-span-4"} />}
                  </div>
                );
              }}</SkeletonList>
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
                          className={isBig ? "md:col-span-8" : "md:col-span-4"}
                          announcement={a}
                          typeLabel={t(TYPE_LABEL_KEY[a.type])}
                          formattedDate={formatNewsDate(a.eventDate, i18n.language)}
                          coverImage={getCoverImage(a.id)}
                          onReadMore={() => setSelectedAnnouncement(a)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Container>
      </main>

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
