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
import type { Announcement } from "../types/announcement.ts";
import { useAnnouncementCategories } from "../hooks/useAnnouncementCategories.ts";
import TabHighlight from "../components/ui/TabHighlight.tsx";
import { tabCarouselClass, useTabCarousel } from "../hooks/useTabCarousel.ts";

function NewsPage() {
  const { t, i18n } = useTranslation();
  const { announcements,totalPages, loading, error, fetchAnnouncements } =
    useAnnouncements();
  const {
    images: announcementImages,
    loading: imagesLoading,
    error: imagesError,
    fetchImages,
    getCoverImage,
    getCoverAlt,
  } = useAnnouncementImages();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const tabRowRef = useTabCarousel(activeCategory);
  const { categories, labelFor } = useAnnouncementCategories();
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetchAnnouncements(i18n.language, currentPage - 1, 10, activeCategory === "All" ? undefined : activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, currentPage, activeCategory]);

  useEffect(() => {
    void fetchImages(announcements.map((announcement) => announcement.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements]);

  const cards = announcements;

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

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
          <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-white">
            {t("newspage.title")}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-white md:text-body-sm">
            {t("newspage.description")}
          </p>

          <div ref={tabRowRef} className={`${tabCarouselClass} mt-[20px] -mb-1 md:justify-center`}>
            <button
              type="button"
              onClick={() => selectCategory("All")}
              className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                activeCategory === "All"
                  ? "border-orange-500 text-white"
                  : "border-white bg-transparent text-white hover:bg-white/10"
              }`}
            >
              {activeCategory === "All" && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
              {t("newspage.category1")}
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                  activeCategory === category.id
                    ? "border-orange-500 text-white"
                    : "border-white bg-transparent text-white hover:bg-white/10"
                }`}
              >
                {activeCategory === category.id && <TabHighlight layoutId="news-category-tab" className="bg-orange-500" />}
                {labelFor(category)}
              </button>
            ))}
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
                          typeLabel={labelFor({ id: a.categoryId, code: a.categoryCode ?? a.type, title: a.categoryTitle })}
                          formattedDate={formatNewsDate(a.eventDate, i18n.language)}
                          coverImage={getCoverImage(a.id)}
                          coverAlt={getCoverAlt(a.id)}
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
          typeLabel={labelFor({ id: selectedAnnouncement.categoryId, code: selectedAnnouncement.categoryCode ?? selectedAnnouncement.type, title: selectedAnnouncement.categoryTitle })}
          onClose={() => setSelectedAnnouncement(null)}
          initialImages={announcementImages[selectedAnnouncement.id]}
        />
      )}
    </div>
  );
}

export default NewsPage;
