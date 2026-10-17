import { useEffect, useRef } from 'react'
import { ClockIcon, UsersIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { formatSchedule } from '../utils/schedule.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import type { ClubResponse } from '../types/clubs.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'

interface ClubDetailModalProps {
    club: ClubResponse
    onClose: () => void
}

function ClubDetailModal({ club, onClose }: Readonly<ClubDetailModalProps>) {
    const { t: translate, i18n } = useTranslation()
    const translateKey = translate as (key: string, options?: Record<string, unknown>) => string
    const t = (key: string, options?: Record<string, unknown>): string => {
        if (key.startsWith("clubs.") || key.startsWith("common.") || key.startsWith("newspage.")) {
            return translateKey(key, options)
        }
        return translateKey(key.startsWith("admin.") ? key : `admin.${key}`, options)
    }

    const dialogRef = useRef<HTMLDialogElement>(null)
    const { closing, requestClose } = useModalExit(onClose)
    useDialogDismiss(dialogRef, requestClose)

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    const clubImages = club.images ?? []
    const coverImage = clubImages.find((img) => img.isCover) ?? clubImages[0]
    const galleryImages = clubImages.filter((img) => !img.isCover)
    const coverUrl = coverImage?.fileUrl ?? club.coverImageUrl

    let galleryGridColumns = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
    if (galleryImages.length === 1) galleryGridColumns = 'grid-cols-1'
    else if (galleryImages.length === 2) galleryGridColumns = 'grid-cols-1 sm:grid-cols-2'

    return (
        <dialog
            ref={dialogRef}
            onClose={requestClose}
            aria-label={club.name}
            className={`fixed inset-0 m-auto max-h-[90vh] w-[min(1100px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-page backdrop:bg-black/50 ${
                closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'
            }`}
        >
            <div className="relative px-[22px] pb-[45px] pt-[40px] md:px-[55px] md:pb-[60px] md:pt-[55px]">
                <ModalCloseButton
                    onClick={requestClose}
                    aria-label={t('ownerClubs.closeClubDetails')}
                    className="absolute right-3 top-[26px] z-20"
                />

                <header className="mx-auto max-w-[850px] text-center">
                    <h2 className="mt-[16px] font-heading text-h2 font-bold leading-[1.15] text-heading">
                        {club.name}
                    </h2>
                    <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-body-sm text-neutral-500">
                        {club.schedule && (
                            <div className="flex items-center gap-[6px]">
                                <ClockIcon size={16} className="text-orange-500" />
                                <span className="whitespace-pre-line">{formatSchedule(club.schedule, translate, i18n.resolvedLanguage ?? i18n.language)}</span>
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

                {coverUrl && (
                    <div className="mt-[40px] overflow-hidden rounded-[22px]">
                        <img
                            src={coverUrl}
                            alt={club.name}
                            className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                        />
                    </div>
                )}

                <section className="mx-auto max-w-[950px] text-left mt-[40px]">
                    <p className="whitespace-pre-line font-body text-body-sm leading-[1.85] text-body-text md:text-body">
                        {club.description}
                    </p>
                </section>

                {galleryImages.length > 0 && (
                    <section className="mt-[60px]">
                        <h3 className="mb-[18px] font-heading text-h4 font-bold text-heading">
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
        </dialog>
    )
}

export default ClubDetailModal