import { useEffect, useRef, useState } from 'react';
import { CalendarDaysIcon, MapPinIcon, SparklesIcon } from '@animateicons/react/lucide'
;
import { useTranslation } from 'react-i18next';
import { ZoomIn } from 'lucide-react'
import { useAnnouncementImages } from '../hooks/useAnnouncementImages.ts';
import { useModalExit } from '../hooks/useModalExit.ts';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.ts';

import type { Announcement, AnnouncementImageResponse } from '../types/announcement.ts';
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import PhotoLightbox from './PhotoLightbox.tsx'

interface NewsDetailModalProps{
    announcement: Announcement;
    typeLabel: string;
    onClose: () => void;
    initialImages?: AnnouncementImageResponse[];
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
    initialImages,
}: Readonly<NewsDetailModalProps>) {
    const { t, i18n } = useTranslation();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [loadedImages, setLoadedImages] = useState<ReadonlySet<string>>(() => new Set())
    const [coverRatio, setCoverRatio] = useState<{ url: string; ratio: number } | null>(null)
    const coverRef = useRef<HTMLImageElement>(null)

    const markLoaded = (url: string) => setLoadedImages((current) => new Set(current).add(url))

    const { closing, requestClose } = useModalExit(onClose);
    useBodyScrollLock();

    const {
        images,
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

    const announcementImages = images[announcement.id] ?? initialImages ?? [];

    const coverImage =
    announcementImages.find((image) => image.isCover) ??
    announcementImages[0];
    const coverUrl = coverImage?.fileUrl
    const coverLoaded = coverUrl ? loadedImages.has(coverUrl) : false
    const knownRatio = coverRatio?.url === coverUrl ? coverRatio?.ratio : undefined

    useEffect(() => {
        const img = coverRef.current
        if (!img || !coverUrl) return
        let frame = 0
        const readSize = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setCoverRatio({ url: coverUrl, ratio: img.naturalWidth / img.naturalHeight })
            } else {
                frame = requestAnimationFrame(readSize)
            }
        }
        frame = requestAnimationFrame(readSize)
        return () => cancelAnimationFrame(frame)
    }, [coverUrl])

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

                {error && (
                <p className="mt-[35px] text-center font-body text-body-sm text-danger">
                    {error}
                </p>
            )}

                {coverImage && (
                    <div
                        role={coverLoaded ? undefined : 'status'}
                        aria-label={coverLoaded ? undefined : t("common.loading")}
                        style={coverLoaded ? undefined : { aspectRatio: knownRatio ?? 16 / 9 }}
                        className={`relative mx-auto mt-lg flex max-h-[85svh] max-w-[950px] items-center justify-center overflow-hidden rounded-[22px] sm:mt-[40px] ${
                            coverLoaded ? 'bg-black' : 'animate-pulse bg-neutral-200'
                        }`}
                    >
                        <img
                            src={coverImage.fileUrl}
                            alt=""
                            aria-hidden="true"
                            className={`absolute inset-0 h-full w-full scale-125 object-cover blur-2xl transition-opacity duration-500 ${
                                coverLoaded ? 'opacity-60' : 'opacity-0'
                            }`}
                        />
                        <img
                            ref={coverRef}
                            src={coverImage.fileUrl}
                            alt={coverImage.altText || announcement.title}
                            onLoad={() => markLoaded(coverImage.fileUrl)}
                            className={`z-10 block max-h-[85svh] w-full object-contain transition-opacity duration-500 ${
                                coverLoaded ? 'relative h-auto opacity-100' : 'absolute inset-0 h-full opacity-0'
                            }`}
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

                {galleryImages.length > 0 && (
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
                        className={`group relative overflow-hidden rounded-2xl ${loadedImages.has(image.fileUrl) ? '' : 'animate-pulse bg-neutral-200'}`}
                    >
                        <img
                            src={image.fileUrl}
                            alt={image.altText || announcement.title}
                            onLoad={() => markLoaded(image.fileUrl)}
                            className={`h-[220px] w-full object-cover transition duration-300 group-hover:scale-105 ${loadedImages.has(image.fileUrl) ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(index)}
                            aria-label={`${t('newspage.gallery')}: ${announcement.title}`}
                            className="absolute inset-0 flex cursor-zoom-in items-end justify-end p-3 focus-visible:outline-2 focus-visible:outline-white"
                        >
                            <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow transition group-hover:scale-105 group-hover:bg-black/70 group-hover:opacity-100 group-focus-within:opacity-100">
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

