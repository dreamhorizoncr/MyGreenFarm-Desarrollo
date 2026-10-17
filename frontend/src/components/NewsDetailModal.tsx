import { useEffect, useState } from 'react';
import { CalendarDaysIcon, MapPinIcon, SparklesIcon } from '@animateicons/react/lucide'
;
import { useTranslation } from 'react-i18next';
import { ZoomIn } from 'lucide-react'
import { useController, useNavigationState } from 'yet-another-react-lightbox'
import { useAnnouncementImages } from '../hooks/useAnnouncementImages.ts';
import { useModalExit } from '../hooks/useModalExit.ts';

import type { Announcement } from '../types/announcement.ts';
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'

interface NewsLightboxNavigationProps {
    activeIndex: number
    total: number
    labels: { previous: string; next: string }
}

function NewsLightboxNavigation({ activeIndex, total, labels }: Readonly<NewsLightboxNavigationProps>) {
    const { prev, next } = useController()
    const { prevDisabled, nextDisabled } = useNavigationState()
    const [imageBounds, setImageBounds] = useState<{ left: number; rightButtonLeft: number; top: number } | null>(null)

    useEffect(() => {
        let frame = 0
        const measureImage = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                const images = Array.from(document.querySelectorAll<HTMLImageElement>('.yarl__slide_image'))
                    .filter((image) => image.getBoundingClientRect().width > 0)
                const viewportCenter = window.innerWidth / 2
                const image = images.reduce<HTMLImageElement | null>((closest, candidate) => {
                    if (!closest) return candidate
                    const closestRect = closest.getBoundingClientRect()
                    const candidateRect = candidate.getBoundingClientRect()
                    return Math.abs(candidateRect.left + candidateRect.width / 2 - viewportCenter)
                        < Math.abs(closestRect.left + closestRect.width / 2 - viewportCenter)
                        ? candidate
                        : closest
                }, null)

                if (!image) return
                const rect = image.getBoundingClientRect()
                const nextBounds = {
                    left: Math.max(8, rect.left - 56),
                    rightButtonLeft: Math.min(window.innerWidth - 52, rect.right + 12),
                    top: rect.top + rect.height / 2,
                }
                setImageBounds((current) =>
                    current && Math.abs(current.left - nextBounds.left) < 2
                        && Math.abs(current.rightButtonLeft - nextBounds.rightButtonLeft) < 2
                        && Math.abs(current.top - nextBounds.top) < 2
                        ? current
                        : nextBounds,
                )
            })
        }

        measureImage()
        window.addEventListener('resize', measureImage)
        window.addEventListener('news-gallery-zoom', measureImage)
        document.addEventListener('load', measureImage, true)
        const positionSync = window.setInterval(measureImage, 40)
        return () => {
            cancelAnimationFrame(frame)
            window.clearInterval(positionSync)
            window.removeEventListener('resize', measureImage)
            window.removeEventListener('news-gallery-zoom', measureImage)
            document.removeEventListener('load', measureImage, true)
        }
    }, [activeIndex])

    if (total < 2 || !imageBounds) return null

    const buttonClass = 'fixed z-[10000] flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-[left,top,scale,opacity] duration-200 ease-out enabled:hover:scale-105 enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 md:size-[44px]'

    return (
        <>
            <button type="button" onClick={() => prev()} disabled={prevDisabled} aria-label={labels.previous} className={buttonClass} style={{ left: imageBounds.left, top: imageBounds.top }}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[40%] rotate-180">
                    <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                </svg>
            </button>
            <button type="button" onClick={() => next()} disabled={nextDisabled} aria-label={labels.next} className={buttonClass} style={{ left: imageBounds.rightButtonLeft, top: imageBounds.top }}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[40%]">
                    <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                </svg>
            </button>
        </>
    )
}

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = previousOverflow;
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
              className="absolute right-3 top-[26px] z-20"
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
        <Lightbox
            open={lightboxIndex !== null}
            close={() => setLightboxIndex(null)}
            index={lightboxIndex ?? 0}
            slides={galleryImages.map((image) => ({ src: image.fileUrl, alt: announcement.title }))}
            plugins={[Zoom]}
            carousel={{ finite: false }}
            controller={{ closeOnBackdropClick: true }}
            on={{
                view: ({ index }) => setLightboxIndex(index),
                zoom: () => window.dispatchEvent(new Event('news-gallery-zoom')),
            }}
            render={{
                buttonZoom: () => null,
                buttonPrev: () => null,
                buttonNext: () => null,
                controls: () => (
                    <NewsLightboxNavigation
                        activeIndex={lightboxIndex ?? 0}
                        total={galleryImages.length}
                        labels={{ previous: t('home.galeria.prevPhoto'), next: t('home.galeria.nextPhoto') }}
                    />
                ),
            }}
            styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, 0.5)' } }}
        />
    </div>
    );
}

export default NewsDetailModal;

