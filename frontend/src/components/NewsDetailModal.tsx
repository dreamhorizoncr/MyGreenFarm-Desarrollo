import { useEffect, useState } from 'react';
import { CalendarDaysIcon, MapPinIcon, SparklesIcon } from '@animateicons/react/lucide'
;
import { useTranslation } from 'react-i18next';
import { ZoomIn } from 'lucide-react'
import { useAnnouncementImages } from '../hooks/useAnnouncementImages.ts';
import { useModalExit } from '../hooks/useModalExit.ts';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.ts';

import type { Announcement } from '../types/announcement.ts';
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import PhotoLightbox from './PhotoLightbox.tsx'

interface NewsDetailModalProps{
    announcement: Announcement;
    typeLabel: string;
    onClose: () => void;
}

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
    typeLabel,
    onClose,
}: Readonly<NewsDetailModalProps>) {
    const { t, i18n } = useTranslation();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    const { closing, requestClose } = useModalExit(onClose);
    useBodyScrollLock();

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
        if (event.key === "Escape" && lightboxIndex === null) {
            requestClose();
        }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
        document.removeEventListener("keydown", handleEscape);
        };
    }, [requestClose, lightboxIndex]);

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
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]"
        >
        <button
            type="button"
            tabIndex={-1}
            aria-label={t('admin.cancel')}
            className="absolute inset-0 size-full cursor-default"
            onClick={requestClose}
        />

        <article
            className={`relative mx-auto max-h-full modal-scroll w-full max-w-[1100px] rounded-[20px] bg-bg-page ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
            <ModalCloseButton
                onClick={requestClose}
                aria-label={t("newspage.closeNews")}
              className="absolute right-[22px] top-[40px] z-20 md:right-[55px] md:top-[55px]"
            />

        <div className="px-[22px] pb-[45px] pt-[40px] md:px-[55px] md:pb-[60px] md:pt-[55px]">

            <header className="mx-auto max-w-[850px] text-center">

            <span className="inline-flex rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
                    {typeLabel}
            </span>
            <h2 className="mt-[16px] font-heading text-h2 font-bold leading-[1.15] text-heading">
                {announcement.title}
            </h2>
            <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-body-sm text-neutral-500">

                {announcement.eventDate && (
                    <div className="flex items-center gap-[6px]">
                        <CalendarDaysIcon size={16} className="text-pink-400" />

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
                    <MapPinIcon size={16} className="text-pink-400" />
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
                    <div className="relative mx-auto mt-[40px] flex h-[260px] max-w-[950px] items-center justify-center overflow-hidden rounded-[22px] bg-black sm:h-[360px] md:h-[480px]">
                        <img
                            src={coverImage.fileUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl"
                        />
                        <img
                            src={coverImage.fileUrl}
                            alt={announcement.title}
                            className="relative z-10 h-full w-full object-contain"
                        />
                    </div>
                )}

                {announcement.aiSummary && (
                    <section className="mx-auto mt-[40px] max-w-[950px] rounded-[20px] bg-gradient-to-br from-green-50 to-white p-[22px] text-left shadow-sm ring-1 ring-green-100 md:p-[28px]">
                        <div className="mb-[12px] inline-flex items-center gap-[6px] rounded-full bg-[var(--pink-400)] px-[12px] py-[6px]">
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

                <h3 className="mb-[18px] font-heading text-h4 font-bold text-heading">
                    {t("newspage.gallery")}
                </h3>

                <div
                    className={`grid gap-[12px] ${galleryGridColumns}`}
                >
                    {galleryImages.map((image, index) => (
                    <div
                        key={image.id}
                        className="relative overflow-hidden rounded-2xl"
                    >
                        <img
                            src={image.fileUrl}
                            alt={announcement.title}
                            className="h-[220px] w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                            aria-label={`${t('newspage.gallery')}: ${announcement.title}`}
                            className="absolute inset-0 flex cursor-zoom-in items-end justify-end p-3 focus-visible:outline-2 focus-visible:outline-white"
                        >
                            <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white shadow transition hover:scale-105 hover:bg-black/70">
                                <ZoomIn size={20} aria-hidden="true" />
                            </span>
                        </button>
                    </div>
                    ))}
                </div>

            </section>
            )}

            </div>
        </article>
        {lightboxIndex !== null && galleryImages[lightboxIndex] && (
            <PhotoLightbox
                images={galleryImages}
                initialIndex={lightboxIndex}
                alt={announcement.title}
                onClose={() => setLightboxIndex(null)}
            />
        )}
    </div>
    );
}

export default NewsDetailModal;

