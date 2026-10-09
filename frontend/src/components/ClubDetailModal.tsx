import { useEffect } from 'react'
import { ClockIcon, UsersIcon, XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { clubService } from '../services/clubs.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import type { ClubResponse } from '../types/clubs.ts'

interface ClubDetailModalProps {
    club: ClubResponse
    onClose: () => void
}

function ClubDetailModal({ club, onClose }: Readonly<ClubDetailModalProps>) {
    const { t: translate } = useTranslation()
    const translateKey = translate as (key: string, options?: Record<string, unknown>) => string
    const t = (key: string, options?: Record<string, unknown>): string => {
        if (key.startsWith("clubs.") || key.startsWith("common.") || key.startsWith("newspage.")) {
            return translateKey(key, options)
        }
        return translateKey(key.startsWith("admin.") ? key : `admin.${key}`, options)
    }

    const { closing, requestClose } = useModalExit(onClose)

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') requestClose()
        }

        document.addEventListener('keydown', handleEscape)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = previousOverflow
        }
    }, [requestClose])

    const clubImages = club.images ?? []
    const coverImage = clubImages.find((img) => img.isCover) ?? clubImages[0]
    const galleryImages = clubImages.filter((img) => !img.isCover)

    let galleryGridColumns = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
    if (galleryImages.length === 1) galleryGridColumns = 'grid-cols-1'
    else if (galleryImages.length === 2) galleryGridColumns = 'grid-cols-1 sm:grid-cols-2'

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
            <button
                type="button"
                tabIndex={-1}
                aria-label={t('admin.cancel')}
                className="absolute inset-0 size-full cursor-default"
                onClick={requestClose}
            />

            <article
                className={`relative mx-auto w-full max-w-[1100px] rounded-3xl bg-bg-page ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'
                    }`}
            >
                <button
                    type="button"
                    onClick={requestClose}
                    aria-label={t('ownerClubs.closeClubDetails')}
                    className="absolute right-[18px] top-[18px] z-20 flex size-[42px] items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
                >
                    <XIcon size={20} />
                </button>

                <div className="px-[22px] pb-[45px] pt-[40px] md:px-[55px] md:pb-[60px] md:pt-[55px]">
                    <header className="mx-auto max-w-[850px] text-center">
                        <h2 className="mt-[16px] font-heading text-[32px] font-bold leading-[1.15] text-heading md:text-h1">
                            {club.name}
                        </h2>
                        <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-body-sm text-neutral-500">
                            {club.schedule && (
                                <div className="flex items-center gap-[6px]">
                                    <ClockIcon size={16} className="text-orange-500" />
                                    <span>{club.schedule}</span>
                                </div>
                            )}
                            {club.maxCapacity !== undefined && (
                                <div className="flex items-center gap-[6px]">
                                    <UsersIcon size={16} className="text-orange-500" />
                                    <span>
                                        {club.maxCapacity} {t('ownerClubs.capacityLabel')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Imagen de portada */}
                    {coverImage ? (
                        <div className="mt-[40px] overflow-hidden rounded-[22px]">
                            <img
                                src={coverImage.fileUrl}
                                alt={club.name}
                                className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                            />
                        </div>
                    ) : club.coverImageUrl ? (
                        <div className="mt-[40px] overflow-hidden rounded-[22px]">
                            <img
                                src={club.coverImageUrl}
                                alt={club.name}
                                className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                            />
                        </div>
                    ) : null}

                    {/* Descripción principal */}
                    <section className="mx-auto max-w-[950px] text-left mt-[40px]">
                        <p className="whitespace-pre-line font-body text-body-sm leading-[1.85] text-body-text md:text-body">
                            {club.description}
                        </p>
                    </section>

                    {/* Galería de imágenes */}
                    {galleryImages.length > 0 && (
                        <section className="mt-[60px]">
                            <h3 className="mb-[18px] font-heading text-[26px] font-bold text-heading">
                                {t('clubs.gallery')}
                            </h3>
                            <div className={`grid gap-[12px] ${galleryGridColumns}`}>
                                {galleryImages.map((image) => (
                                    <div key={image.id} className="overflow-hidden rounded-2xl">
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
    )
}

export default ClubDetailModal