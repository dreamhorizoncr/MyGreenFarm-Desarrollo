
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
    UserRound,
    Flower2,
    Leaf,
    Sparkles,
    Sun,
    Clover,
    Carrot,
    Apple,
    Bird,
    Rabbit,
    Sprout,
    Heart,
    Star,
    Cloud
    } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import CarouselDots from '../components/ui/CarouselDots.tsx'
import CarouselArrowIcon from '../components/ui/CarouselArrowIcon.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

import { adminService } from '../services/admin.ts'
import type { UserInfo } from '../types/auth.ts'

const DECORATION_COLORS = ['text-accent', 'text-link', 'text-green-500']

const ACCENT_COLORS = ['text-green-500', 'text-link', 'text-accent']

const BADGE_ICONS = [Flower2, Sun, Clover, Carrot, Apple, Bird, Rabbit, Sprout]

const ACCENT_ICONS = [Leaf, Sparkles, Heart, Star, Cloud]

const DECORATION_LAYOUTS = [
    { badge: '-left-2 top-3', accent: '-right-2 bottom-2' },
    { badge: '-right-2 top-4', accent: '-left-1 top-1/2' },
    { badge: '-left-2 top-3', accent: null },
    { badge: '-right-2 top-4', accent: '-left-2 bottom-3' },
    { badge: '-right-1 bottom-4', accent: null },
]

    const squishyTransition = {
    type: 'spring' as const,
    stiffness: 180,
    damping: 12,
    mass: 0.9,
    }

    const teacherColors = [
    {
        border: 'border-pink-400',
        background: 'var(--accent-pink)',
    },
    {
        border: 'border-orange-500',
        background: 'var(--link-default)',
    },
    {
        border: 'border-green-500',
        background: 'var(--heading-default)',
    },
    ] as const

    const teamSlideClass = 'flex shrink-0 basis-full justify-center px-sm pb-xs pt-[4.5rem] sm:basis-1/2 sm:pb-lg lg:basis-1/3 xl:basis-1/4'

    const teamArrowClass =
    'z-20 size-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:scale-105 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-500)]'

    const TEAM_BREAKPOINTS = [
    { query: '(min-width: 80rem)', perView: 4 },
    { query: '(min-width: 64rem)', perView: 3 },
    { query: '(min-width: 40rem)', perView: 2 },
    ]

    const teamPerView = () => TEAM_BREAKPOINTS.find(({ query }) => window.matchMedia(query).matches)?.perView ?? 1

    const shuffled = <T,>(items: T[]) => {
    const result = [...items]
    const random = crypto.getRandomValues(new Uint32Array(result.length))
    for (let i = result.length - 1; i > 0; i--) {
        const j = random[i] % (i + 1)
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
    }

    function AboutUsPage() {
    const reduceMotion = useReducedMotion()
    const { t } = useTranslation()

    const [teachers, setTeachers] = useState<UserInfo[]>([])
    const [teachersLoading, setTeachersLoading] = useState(true)
    const [teachersError, setTeachersError] = useState(false)

    useEffect(() => {
        let active = true

        const loadTeachers = async () => {
        try {
            const data = await adminService.getTeachers()

            if (active) {
            setTeachers(
                shuffled(data.filter((user) => user.role === 'TEACHER'))
            )
            setTeachersError(false)
            }
        } catch {
            if (active) {
            setTeachersError(true)
            }
        } finally {
            if (active) {
            setTeachersLoading(false)
            }
        }
        }

        void loadTeachers()

        return () => {
        active = false
        }
    }, [])

    const teacherSkeletonCount = useSkeletonCount('about-teachers', teachersLoading, teachers.length, 4)

    const [perView, setPerView] = useState(teamPerView)
    const [pageIndex, setPageIndex] = useState(0)

    useEffect(() => {
        const lists = TEAM_BREAKPOINTS.map(({ query }) => window.matchMedia(query))
        const update = () => setPerView(teamPerView())
        lists.forEach((list) => list.addEventListener('change', update))
        return () => lists.forEach((list) => list.removeEventListener('change', update))
    }, [])

    const pageCount = Math.max(1, Math.ceil(teachers.length / perView))
    const page = Math.min(pageIndex, pageCount - 1)
    const teamPages = Array.from({ length: pageCount }, (_, index) => teachers.slice(index * perView, index * perView + perView))

    const pageRefs = useRef<(HTMLDivElement | null)[]>([])
    const [viewHeight, setViewHeight] = useState<number>()

    useEffect(() => {
        const element = pageRefs.current[page]
        if (!element) return
        const observer = new ResizeObserver(() => setViewHeight(element.offsetHeight))
        observer.observe(element)
        return () => observer.disconnect()
    }, [page, perView, teachers])

    const goToPage = (index: number) => setPageIndex(index)

    const moveTeam = (direction: 1 | -1) => setPageIndex((page + direction + pageCount) % pageCount)

    const teamArrow = (direction: 1 | -1, className = '') => (
        <button
        type="button"
        onClick={() => moveTeam(direction)}
        aria-label={t(direction === 1 ? 'aboutUsPage.team.next' : 'aboutUsPage.team.previous')}
        className={`${teamArrowClass} ${className}`}
        >
        <CarouselArrowIcon flip={direction === -1} />
        </button>
    )

    return (
        <>
            <Navbar />

            <main className="flex min-w-0 flex-col bg-bg-page">
            <section
                data-scroll-bg="green"
                className="flex min-h-[280px] items-center bg-green-500 px-[30px] py-[40px] text-center text-white xs:min-h-[320px]"
            >
                <div className="mx-auto w-full max-w-[700px]">
                <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-white">
                    {t('aboutUsPage.hero.title')}
                </h1>

                <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body leading-[1.6] text-white">
                    {t('aboutUsPage.hero.description')}
                </p>
                </div>
            </section>

            <section
                id="our-teachers"
                className="relative w-full overflow-hidden"
            >
                <Container className="relative flex flex-col items-center gap-xl py-1000 sm:py-1200 lg:py-1500">
                <div className="relative z-10 flex w-full max-w-[55rem] flex-col items-center gap-700 text-center">
                    <h2 className="m-0 font-heading text-h2 font-bold leading-tight text-heading">
                    {t('aboutUsPage.team.title')}
                    </h2>

                    <p className="m-0 max-w-[48rem] font-body text-body leading-[1.6] text-body-text">
                    {t('aboutUsPage.team.description')}
                    </p>
                </div>

                {teachersLoading && (
                    <div className="relative z-10 w-full animate-pulse" aria-hidden="true">
                    <div className="relative">
                        <div className="flex justify-center sm:px-14">
                        <SkeletonList count={Math.min(perView, teacherSkeletonCount)}>{() => (
                            <div className={teamSlideClass}>
                            <div className="flex w-full max-w-[19rem] flex-col items-center gap-md">
                                <div className="flex h-60 w-60 shrink-0 items-center justify-center sm:h-56 sm:w-56 lg:h-52 lg:w-52 xl:h-56 xl:w-56">
                                <div className="h-[78%] w-[78%] rounded-full bg-neutral-200" />
                                </div>
                                <div className="flex w-full flex-col items-center gap-2">
                                <div className="mt-1 h-6 w-44 rounded bg-neutral-200" />
                                <div className="h-6 w-32 rounded bg-neutral-200" />
                                <div className="mt-sm h-4 w-20 rounded bg-neutral-200" />
                                </div>
                            </div>
                            </div>
                        )}</SkeletonList>
                        </div>

                        {teacherSkeletonCount > perView && (
                        <>
                            <div className="absolute left-0 top-[12rem] hidden size-11 -translate-y-1/2 rounded-full bg-neutral-200 sm:block" />
                            <div className="absolute right-0 top-[12rem] hidden size-11 -translate-y-1/2 rounded-full bg-neutral-200 sm:block" />
                        </>
                        )}
                    </div>

                    {teacherSkeletonCount > perView && (
                        <>
                        <div className="mt-md hidden justify-center gap-2 sm:flex">
                            <SkeletonList count={Math.min(12, Math.ceil(teacherSkeletonCount / perView))}>{() => (
                            <div className="size-2 rounded-full bg-neutral-200" />
                            )}</SkeletonList>
                        </div>
                        <div className="mt-xs flex flex-col items-center gap-xs sm:hidden">
                            <div className="flex items-center gap-md">
                            <div className="size-11 rounded-full bg-neutral-200" />
                            <div className="size-11 rounded-full bg-neutral-200" />
                            </div>
                            <div className="h-5 w-14 rounded bg-neutral-200" />
                        </div>
                        </>
                    )}
                    </div>
                )}

                {!teachersLoading && teachersError && (
                    <div className="relative z-10 w-full rounded-3xl bg-[var(--grey-100)] px-lg py-1000 text-center">
                    <p className="m-0 font-body text-body-sm text-body-text">
                        {t('aboutUsPage.team.placeholderDescription')}
                    </p>
                    </div>
                )}

                {!teachersLoading && !teachersError && teachers.length > 0 && (
                    <div className="relative z-10 w-full">
                    <div className="relative">
                    <motion.div
                        className="-mx-1100 touch-pan-y overflow-x-clip sm:mx-0"
                        initial={false}
                        animate={{ height: viewHeight ?? 'auto' }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                        onPanEnd={(_, info) => {
                        if (pageCount < 2) return
                        if (info.offset.x < -60) moveTeam(1)
                        else if (info.offset.x > 60) moveTeam(-1)
                        }}
                    >
                    <motion.div
                        className="flex items-start"
                        initial={false}
                        animate={{ x: `${-page * 100}%` }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                    >
                        {teamPages.map((group, groupIndex) => (
                        <div
                            key={group[0]?.id ?? groupIndex}
                            ref={(element) => {
                            pageRefs.current[groupIndex] = element
                            }}
                            inert={groupIndex !== page}
                            className="flex w-full shrink-0 justify-center px-1100 sm:px-14"
                        >
                        {group.map((teacher, offset) => {
                        const index = groupIndex * perView + offset
                        const color = teacherColors[index % teacherColors.length]
                        const rotation = index % 2 === 0 ? -8 : 8
                        const fullName = `${teacher.firstName} ${teacher.lastName}`
                        const decoration = index % 3
                        const BadgeIcon = BADGE_ICONS[index % BADGE_ICONS.length]
                        const AccentIcon = ACCENT_ICONS[(index * 2) % ACCENT_ICONS.length]
                        const layout = DECORATION_LAYOUTS[index % DECORATION_LAYOUTS.length]

                        return (
                            <div key={teacher.id} className={teamSlideClass}>
                            <motion.article
                            initial="rest"
                            animate="rest"
                            whileHover={reduceMotion ? undefined : 'hover'}
                            variants={{
                                rest: {
                                scale: 1,
                                y: 0,
                                },
                                hover: {
                                scale: 1.045,
                                y: -8,
                                },
                            }}
                            transition={squishyTransition}
                            className="group relative z-0 flex w-full max-w-[19rem] min-w-0 flex-col items-center gap-md text-center hover:z-10"
                            >
                            <div className="relative flex h-60 w-60 shrink-0 items-center justify-center sm:h-56 sm:w-56 lg:h-52 lg:w-52 xl:h-56 xl:w-56">
                                <motion.svg
                                viewBox="0 0 220 220"
                                fill="none"
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                                variants={{
                                    rest: {
                                    scale: 1,
                                    opacity: 0.22,
                                    rotate: 0,
                                    },
                                    hover: {
                                    scale: 1.24,
                                    opacity: 0.5,
                                    rotate: 18,
                                    },
                                }}
                                transition={squishyTransition}
                                >
                                <motion.circle
                                    cx="110"
                                    cy="78"
                                    r="60"
                                    fill={color.background}
                                    variants={{
                                    rest: {
                                        scaleY: 1,
                                        y: 0,
                                    },
                                    hover: {
                                        scaleY: 0.65,
                                        y: -24,
                                    },
                                    }}
                                    transition={squishyTransition}
                                />

                                <motion.ellipse
                                    cx="110"
                                    cy="150"
                                    rx="66"
                                    ry="34"
                                    fill={color.background}
                                    variants={{
                                    rest: {
                                        scaleY: 1,
                                        y: 0,
                                    },
                                    hover: {
                                        scaleY: 2,
                                        y: 14,
                                    },
                                    }}
                                    transition={squishyTransition}
                                />
                                </motion.svg>

                                <motion.div
                                aria-hidden="true"
                                className={`pointer-events-none absolute z-20 ${layout.badge}`}
                                variants={{
                                    rest: {
                                    rotate: -12,
                                    scale: 1,
                                    y: 0,
                                    },
                                    hover: {
                                    rotate: 25,
                                    scale: 1.25,
                                    y: -8,
                                    },
                                }}
                                transition={squishyTransition}
                                >
                                <div
                                    className={`flex size-12 items-center justify-center rounded-full bg-white shadow-sm ${DECORATION_COLORS[decoration]}`}
                                >
                                    <BadgeIcon size={32} strokeWidth={1.7} />
                                </div>
                                </motion.div>

                                {layout.accent && (
                                <motion.div
                                    aria-hidden="true"
                                    className={`pointer-events-none absolute z-20 ${layout.accent} ${ACCENT_COLORS[(index + 1) % ACCENT_COLORS.length]}`}
                                    variants={{
                                    rest: {
                                        rotate: -15,
                                        scale: 0.9,
                                        opacity: 0.9,
                                    },
                                    hover: {
                                        rotate: 20,
                                        scale: 1.25,
                                        opacity: 1,
                                    },
                                    }}
                                    transition={squishyTransition}
                                >
                                    <AccentIcon size={36} strokeWidth={1.7} />
                                </motion.div>
                                )}

                                <motion.div
                                variants={{
                                    rest: {
                                    rotate: rotation,
                                    scale: 1,
                                    y: 0,
                                    },
                                    hover: {
                                    rotate: 0,
                                    scale: 1.08,
                                    y: -6,
                                    },
                                }}
                                transition={squishyTransition}
                                className={`relative z-10 h-[78%] w-[78%] rounded-full border-[3px] border-dashed bg-white p-2 shadow-sm ${color.border}`}
                                >
                                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-green-500/10">
                                    {teacher.photoUrl ? (
                                    <motion.img
                                        src={teacher.photoUrl}
                                        alt={fullName}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                        variants={{
                                        rest: {
                                            scale: 1,
                                        },
                                        hover: {
                                            scale: 1.13,
                                        },
                                        }}
                                        transition={squishyTransition}
                                    />
                                    ) : (
                                    <UserRound
                                        size={72}
                                        strokeWidth={1.5}
                                        className="text-green-500"
                                        aria-hidden="true"
                                    />
                                    )}
                                </div>
                                </motion.div>
                            </div>

                            <div className="relative z-10 flex w-full min-w-0 flex-col items-center gap-sm">
                                <motion.h3
                                variants={{
                                    rest: {
                                    y: 0,
                                    },
                                    hover: {
                                    y: -3,
                                    },
                                }}
                                transition={squishyTransition}
                                className="m-0 w-full break-words font-heading text-h5 font-bold uppercase leading-snug text-heading"
                                >
                                {fullName}
                                </motion.h3>

                                <p className="m-0 font-body text-body-sm leading-[1.6] text-body-text">
                                {t(`aboutUsPage.roles.${teacher.role}`, {
                                    defaultValue: teacher.role,
                                })}
                                </p>
                            </div>
                            </motion.article>
                            </div>
                        )
                        })}
                        </div>
                        ))}
                    </motion.div>
                    </motion.div>

                    {pageCount > 1 && (
                        <>
                        {teamArrow(-1, 'absolute left-0 top-[12rem] hidden -translate-y-1/2 sm:inline-flex')}
                        {teamArrow(1, 'absolute right-0 top-[12rem] hidden -translate-y-1/2 sm:inline-flex')}
                        </>
                    )}
                    </div>

                    {pageCount > 1 && (
                        <>
                        <div className="mt-md hidden sm:block">
                            <CarouselDots
                            className="justify-center"
                            count={pageCount}
                            activeIndex={page}
                            onSelect={goToPage}
                            ariaLabel={t('aboutUsPage.team.navigation')}
                            getItemLabel={(index) => t('aboutUsPage.team.goTo', { number: index + 1 })}
                            />
                        </div>
                        <div className="mt-xs flex flex-col items-center gap-xs sm:hidden">
                            <div className="flex items-center gap-md">
                            {teamArrow(-1, 'inline-flex')}
                            {teamArrow(1, 'inline-flex')}
                            </div>
                            <p className="m-0 font-body text-body-sm font-semibold text-heading" aria-live="polite">
                            {page + 1} / {pageCount}
                            </p>
                        </div>
                        </>
                    )}
                    </div>
                )}

                {!teachersLoading &&
                    !teachersError &&
                    teachers.length === 0 && (
                    <div className="relative z-10 flex w-full flex-col items-center gap-md rounded-3xl bg-[var(--grey-100)] px-md py-1000 text-center sm:px-lg lg:py-1500">
                        <div className="flex size-20 items-center justify-center rounded-full bg-white text-green-500">
                        <UserRound
                            size={44}
                            strokeWidth={1.5}
                            aria-hidden="true"
                        />
                        </div>

                        <p className="m-0 max-w-[25rem] font-body text-body-sm leading-[1.6] text-body-text">
                        {t('aboutUsPage.team.placeholderDescription')}
                        </p>
                    </div>
                    )}
                </Container>
            </section>
            </main>
        </>
        )
}

export default AboutUsPage
