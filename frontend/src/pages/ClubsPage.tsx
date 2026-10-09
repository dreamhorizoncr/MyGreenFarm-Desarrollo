import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UsersIcon, SparklesIcon, ClockIcon } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import ClubDetailModal from '../components/ClubDetailModal.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { clubService } from '../services/clubs.ts'
import type { ClubResponse } from '../types/clubs.ts'

interface PublicClubCardProps {
    club: ClubResponse
    onSelect: () => void
}

function PublicClubCard({ club, onSelect }: Readonly<PublicClubCardProps>) {
    const { t: translate } = useTranslation()
    const translateKey = translate as (key: string, options?: Record<string, unknown>) => string
    const t = (key: string, options?: Record<string, unknown>): string =>
        translateKey(key.startsWith("admin.") ? key : `admin.${key}`, options)

    const available = club.availableSpots ?? club.maxCapacity ?? 0
    const maxCap = club.maxCapacity ?? 0
    const isFull = available <= 0

    return (
        <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            {/* Imagen de portada */}
            <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100">
                {club.coverImageUrl ? (
                    <img
                        src={club.coverImageUrl}
                        alt={club.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <span className="font-body text-body-sm text-neutral-400">
                            {t("ownerClubs.coverImage")}
                        </span>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="flex flex-1 flex-col gap-sm px-lg pb-lg pt-md">
                <div className="flex items-start justify-between gap-sm">
                    <h3 className="m-0 min-w-0 flex-1 text-left font-heading text-h4 font-bold text-green-500 line-clamp-2">
                        {club.name}
                    </h3>
                    {club.maxCapacity !== undefined && (
                        <span className="w-fit shrink-0 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white flex items-center gap-1">
                            <UsersIcon size={12} />
                            <span>{available}</span> {t("ownerClubs.capacityLabel")}
                        </span>
                    )}
                </div>

                <p className="m-0 min-h-[48px] text-left font-body text-body-sm leading-relaxed text-neutral-600 line-clamp-2">
                    {club.description}
                </p>

                <div className="my-1 border-t border-neutral-200" />

                {/* Detalles: Horario y Cupos Disponibles */}
                <div className="space-y-2xs pt-xs text-left">
                    {club.schedule && (
                        <div className="font-body text-body-sm leading-relaxed text-neutral-500">
                            <div className="flex items-center gap-2">
                                <ClockIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                                <span className="font-semibold text-neutral-600">
                                    {t("ownerClubs.schedule")}
                                </span>
                            </div>
                            <p className="m-0 mt-2xs px-1 text-left text-body-sm">{club.schedule}</p>
                        </div>
                    )}

                    <div className="font-body text-body-sm leading-relaxed text-neutral-500">
                        <div className="flex items-center gap-2">
                            <UsersIcon size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
                            <span className="font-semibold text-neutral-600">
                                {t("ownerClubs.availableSpots")}
                            </span>
                        </div>
                        <p className="m-0 mt-2xs px-1 text-left text-body-sm">
                            {isFull ? (
                                <span className="font-bold text-red-500">
                                    {t("ownerClubs.noSpotsAvailable")}
                                </span>
                            ) : (
                                <span>{maxCap} {t("ownerClubs.capacityUnit")}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Botón Más Información */}
                <div className="mt-auto pt-md">
                    <button
                        type="button"
                        onClick={onSelect}
                        className="inline-flex w-full items-center justify-center gap-xs rounded-full bg-orange-500 px-lg py-sm font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
                    >
                        {translateKey("clubs.moreInfo")}
                    </button>
                </div>
            </div>
        </article>
    )
}

function ClubsPage() {
    const { t, i18n } = useTranslation()
    const [clubs, setClubs] = useState<ClubResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedClub, setSelectedClub] = useState<ClubResponse | null>(null)

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                setLoading(true)
                const languageCode = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
                const data = await clubService.getAll({ lang: languageCode, size: 50 })

                let clubsWithImages = await Promise.all(
                    data.content.map(async (club) => {
                        try {
                            let imgs = club.images
                            if (!imgs || imgs.length === 0) {
                                imgs = await clubService.getImagesByClub(club.id)
                            }
                            const coverImg = imgs.find((img) => img.isCover) ?? imgs[0]
                            return {
                                ...club,
                                images: imgs,
                                coverImageUrl: coverImg?.fileUrl ?? club.coverImageUrl,
                            }
                        } catch {
                            return club
                        }
                    })
                )

                // Traducción dinámica de datos provenientes de la BD (Backend Batch Translation)
                if (languageCode !== "es" && clubsWithImages.length > 0) {
                    const translationItems = clubsWithImages.flatMap((club) => [
                        { entityId: String(club.id), fieldName: "name", originalText: club.name },
                        { entityId: String(club.id), fieldName: "description", originalText: club.description },
                        ...(club.schedule
                            ? [{ entityId: String(club.id), fieldName: "schedule", originalText: club.schedule }]
                            : []),
                    ])

                    try {
                        const translations = await clubService.translateBatch("club", languageCode, translationItems)
                        clubsWithImages = clubsWithImages.map((club) => ({
                            ...club,
                            name: translations[`${club.id}:name`] ?? club.name,
                            description: translations[`${club.id}:description`] ?? club.description,
                            schedule: club.schedule
                                ? translations[`${club.id}:schedule`] ?? club.schedule
                                : club.schedule,
                        }))
                    } catch (translationError) {
                        console.error("No se pudieron traducir los clubs:", translationError)
                    }
                }

                const publishedClubs = clubsWithImages.filter(
                    (club) => club.isPublished ?? (club as unknown as { published?: boolean }).published ?? false
                )

                setClubs(publishedClubs)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        void fetchClubs()
    }, [i18n.language])

    return (
        <div id="clubs-page" className="flex min-h-screen flex-col bg-bg-page">
            <Navbar />

            {/* Header Banner */}
            <section className="flex min-h-[220px] items-center bg-green-500 px-7.5 py-10 text-center text-white md:min-h-[260px]">
                <div className="mx-auto w-full max-w-175">
                    <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
                        {t('clubs.title')}
                    </h1>
                    <p className="mx-auto mt-4 max-w-140 font-body text-body-sm leading-[1.6] text-white">
                        {t('clubs.subtitle')}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <main className="flex flex-1 items-center justify-center">
                <Container className="py-12 md:py-20">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <article
                                    key={`skeleton-${index}`}
                                    className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
                                >
                                    {/* Imagen de portada */}
                                    <div className="relative h-[180px] w-full overflow-hidden bg-neutral-100 shrink-0">
                                        <Skeleton shape="rect" className="h-full w-full rounded-none" />
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex flex-1 flex-col gap-sm px-lg pb-lg pt-md">
                                        {/* Título y Badge */}
                                        <div className="flex items-start justify-between gap-sm">
                                            <div className="flex-1 min-w-0">
                                                <Skeleton shape="line" className="h-6 w-4/5" />
                                            </div>
                                            <Skeleton shape="rect" className="h-6 w-20 shrink-0 rounded-full" />
                                        </div>

                                        {/* Descripción (2 líneas) */}
                                        <div className="min-h-[48px] space-y-2 py-3.5">
                                            <Skeleton shape="line" className="h-4 w-full" />
                                            <Skeleton shape="line" className="h-4 w-2/3" />
                                        </div>

                                        <div className="my-1 border-t border-neutral-200" />

                                        {/* Detalles: Horario y Cupos */}
                                        <div className="space-y-2xs pt-lg text-left">
                                            {/* Horario */}
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton shape="rect" className="h-[18px] w-[18px] shrink-0 rounded-full" />
                                                    <Skeleton shape="line" className="h-4 w-20" />
                                                </div>
                                                <div className="px-1 mt-2xs">
                                                    <Skeleton shape="line" className="h-4 w-36" />
                                                </div>
                                            </div>

                                            {/* Cupos disponibles */}
                                            <div className="space-y-2.5 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton shape="rect" className="h-[18px] w-[18px] shrink-0 rounded-full" />
                                                    <Skeleton shape="line" className="h-4 w-32" />
                                                </div>
                                                <div className="px-1 mt-2xs">
                                                    <Skeleton shape="line" className="h-4 w-24" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botón Más Información */}
                                        <div className="mt-xl pt-md">
                                            <Skeleton shape="rect" className="h-10 w-full rounded-full" />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : clubs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
                            {clubs.map((club) => (
                                <PublicClubCard
                                    key={club.id}
                                    club={club}
                                    onSelect={() => setSelectedClub(club)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="mx-auto max-w-140 rounded-3xl border border-neutral-200 bg-white p-xl text-center shadow-md md:p-2xl">
                            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                                <UsersIcon size={56} aria-hidden="true" />
                                <div className="absolute -right-1 -top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                                    <SparklesIcon size={20} aria-hidden="true" />
                                </div>
                            </div>

                            <h2 className="mt-xl font-heading text-2xl font-bold leading-snug text-heading md:text-3xl">
                                {t('clubs.comingSoonTitle')}
                            </h2>

                            <p className="mt-md font-body text-body text-body-text leading-relaxed">
                                {t('clubs.comingSoonDescription')}
                            </p>

                            <div className="mt-lg inline-flex items-center gap-xs rounded-full bg-neutral-100 px-md py-xs text-caption font-semibold text-neutral-600">
                                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                {t('clubs.statusTag')}
                            </div>
                        </div>
                    )}
                </Container>
            </main>

            {selectedClub && (
                <ClubDetailModal
                    club={selectedClub}
                    onClose={() => setSelectedClub(null)}
                />
            )}
        </div>
    )
}

export default ClubsPage