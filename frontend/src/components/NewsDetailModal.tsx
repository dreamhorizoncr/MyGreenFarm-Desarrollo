import { useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, SparklesIcon, XIcon } from '@animateicons/react/lucide';
import { useTranslation } from 'react-i18next';
import { useAnnouncementImages } from '../hooks/useAnnouncementImages.ts';

import type { Announcement, AnnouncementType } from '../types/announcement.ts';

interface NewsDetailModalProps{
    announcement: Announcement;
    onClose: () => void;
}

const TYPE_LABEL_KEY: Record<AnnouncementType,
    |'newspage.category1'
    |'newspage.category2'
    |'newspage.category3'
    |'newspage.category4'
    |'newspage.category5'
    |'newspage.category6'
    > = {
        NEWS: 'newspage.category2',
        EVENT: 'newspage.category3',
        NOTICE: 'newspage.category4',
        GENERAL: 'newspage.category5',
        TRANSPORT: 'newspage.category6',
    };

function formatDate(
    iso: string|null|undefined,
    lang: string,
    ):string{
        if(!iso) return "";

    return new Date(iso).toLocaleDateString(lang,{
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function NewsDetailModal({
    announcement,
    onClose,
}: Readonly<NewsDetailModalProps>) {
    const { t, i18n } = useTranslation();

    const {
        images,
        loading,
        error,
        fetchImages,
    } = useAnnouncementImages();

    useEffect(() => {
        void fetchImages([announcement.id]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [announcement.id]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            onClose();
        }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    const announcementImages = images[announcement.id] ?? [];

    const coverImage =
    announcementImages.find((image) => image.isCover) ??
    announcementImages[0];

    const galleryImages = announcementImages.filter(
        (image) => !image.isCover,
    );

    let galleryGridColumns = "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
    if (galleryImages.length === 1) galleryGridColumns = "grid-cols-1"
    else if (galleryImages.length === 2) galleryGridColumns = "grid-cols-1 sm:grid-cols-2"

    return (
        <div
        className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]"
        >
        <button
            type="button"
            tabIndex={-1}
            aria-label={t('admin.cancel')}
            className="absolute inset-0 size-full cursor-default"
            onClick={onClose}
        />

        <article
            className="relative mx-auto w-full max-w-[1100px] rounded-3xl bg-bg-page"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar noticia"
                className="absolute right-[18px] top-[18px] z-20 flex size-[42px] items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
                >
                <XIcon size={20} />
            </button>

        <div className="px-[22px] pb-[45px] pt-[40px] md:px-[55px] md:pb-[60px] md:pt-[55px]">

            <header className="mx-auto max-w-[850px] text-center">

            <span className="inline-flex rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
                    {t(TYPE_LABEL_KEY[announcement.type])}
            </span>
            <h2 className="mt-[16px] font-heading text-[32px] font-bold leading-[1.15] text-heading md:text-h1">
                {announcement.title}
            </h2>
            <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-body-sm text-neutral-500">

                {announcement.eventDate && (
                    <div className="flex items-center gap-[6px]">
                        <CalendarDaysIcon size={16} />

                    <span>
                        {formatDate(
                        announcement.eventDate,
                        i18n.language,
                        )}
                    </span>
                    </div>
                )}

                {announcement.location && (
                    <div className="flex items-center gap-[6px]">
                    <MapPinIcon size={16} />
                    <span>{announcement.location}</span>
                    </div>
                )}

            </div>
            </header>

                {loading && (
                <p className="mt-[35px] text-center font-body text-body-sm text-neutral-500">
                    {t("common.loading")}
                </p>
            )}

                {error && (
                <p className="mt-[35px] text-center font-body text-body-sm text-danger">
                    {error}
                </p>
            )}

                {!loading && coverImage && (
                    <div className="mt-[40px] overflow-hidden rounded-[22px]">
                        <img
                            src={coverImage.fileUrl}
                            alt={announcement.title}
                            className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                        />
                    </div>
                )}

                {announcement.aiSummary && (
                    <section className="mx-auto mt-[40px] max-w-[950px] rounded-[20px] bg-gradient-to-br from-green-50 to-white p-[22px] text-left shadow-sm ring-1 ring-green-100 md:p-[28px]">
                        <div className="mb-[12px] inline-flex items-center gap-[6px] rounded-full bg-green-500 px-[12px] py-[6px]">
                            <SparklesIcon size={14} className="text-white" aria-hidden="true" />
                            <span className="font-heading text-caption font-bold uppercase tracking-wide text-white">
                                {t("newspage.aiSummary")}
                            </span>
                        </div>
                        <p className="font-body text-body leading-[1.7] text-heading md:text-button">
                            {announcement.aiSummary}
                        </p>
                    </section>
                )}

            <section className={`mx-auto max-w-[950px] text-left ${announcement.aiSummary ? 'mt-[30px]' : 'mt-[50px]'}`}>
                <p className="whitespace-pre-line font-body text-body-sm leading-[1.85] text-body-text md:text-body">
                    {announcement.content}
                    </p>
            </section>

                {!loading && galleryImages.length > 0 && (
                    <section className="mt-[60px]">

                <h3 className="mb-[18px] font-heading text-[26px] font-bold text-heading">
                    {t("newspage.gallery")}
                </h3>

                <div
                    className={`grid gap-[12px] ${galleryGridColumns}`}
                >
                    {galleryImages.map((image) => (
                    <div
                        key={image.id}
                        className="overflow-hidden rounded-2xl"
                    >
                        <img
                        src={image.fileUrl}
                        alt=""
                        className="h-[220px] w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                    </div>
                    ))}
                </div>

            </section>
            )}

            </div>
        </article>
    </div>
    );
}

export default NewsDetailModal;

