
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
    UserRound,
    Flower2,
    Leaf,
    Sparkles
    } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

import { adminService } from '../services/admin.ts'
import type { UserInfo } from '../types/auth.ts'

const DECORATION_COLORS = ['text-accent', 'text-link', 'text-green-500']

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
                data.filter((user) => user.role === 'TEACHER')
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

    return (
        <>
            <Navbar />

            <main className="flex min-w-0 flex-col bg-bg-page">
            {/* Hero */}
            <section
                data-scroll-bg="green"
                className="flex min-h-[280px] items-center bg-green-500 px-[30px] py-[40px] text-center text-white xs:min-h-[320px]"
            >
                <div className="mx-auto w-full max-w-[700px]">
                <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
                    {t('aboutUsPage.hero.title')}
                </h1>

                <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-white">
                    {t('aboutUsPage.hero.description')}
                </p>
                </div>
            </section>

            {/* Our Teachers */}
            <section
                id="our-teachers"
                className="relative w-full overflow-hidden"
            >
                <Container className="relative flex flex-col items-center gap-xl py-1000 sm:py-1200 lg:py-1500">
                {/* Encabezado */}
                <div className="relative z-10 flex w-full max-w-[55rem] flex-col items-center gap-700 text-center">
                    <h2 className="m-0 font-heading text-h2 font-bold leading-tight text-heading">
                    {t('aboutUsPage.team.title')}
                    </h2>

                    <p className="m-0 max-w-[48rem] font-body text-body-sm leading-[1.6] text-body-text">
                    {t('aboutUsPage.team.description')}
                    </p>
                </div>

                {/* Loading */}
                {teachersLoading && (
                    <div className="grid w-full grid-cols-1 justify-items-center gap-x-lg gap-y-xl sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <SkeletonList count={teacherSkeletonCount}>{() => (
                        <div className="flex w-full max-w-[19rem] animate-pulse flex-col items-center gap-md">
                        <div className="size-48 rounded-full bg-neutral-200" />
                        <div className="h-5 w-40 rounded bg-neutral-200" />
                        <div className="h-4 w-24 rounded bg-neutral-200" />
                        </div>
                    )}</SkeletonList>
                    </div>
                )}

                {/* Error */}
                {!teachersLoading && teachersError && (
                    <div className="relative z-10 w-full rounded-3xl bg-[var(--grey-100)] px-lg py-1000 text-center">
                    <p className="m-0 font-body text-body-sm text-body-text">
                        {t('aboutUsPage.team.placeholderDescription')}
                    </p>
                    </div>
                )}

                {/* Docentes */}
                {!teachersLoading && !teachersError && teachers.length > 0 && (
                    <div className="relative z-10 w-full pt-md sm:pt-lg lg:pt-xl">
                    <div className="grid w-full grid-cols-1 justify-items-center gap-x-lg gap-y-xl sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-md xl:grid-cols-4 xl:gap-x-lg">
                        {teachers.map((teacher, index) => {
                        const color = teacherColors[index % teacherColors.length]
                        const rotation = index % 2 === 0 ? -8 : 8
                        const fullName = `${teacher.firstName} ${teacher.lastName}`
                        const decoration = index % 3

                        return (
                            <motion.article
                            key={teacher.id}
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
                            {/* Retrato y decoraciones */}
                            <div className="relative flex h-60 w-60 shrink-0 items-center justify-center sm:h-56 sm:w-56 lg:h-52 lg:w-52 xl:h-56 xl:w-56">
                                {/* Efecto Squishy */}
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

                                {/* Flor */}
                                <motion.div
                                aria-hidden="true"
                                className={`pointer-events-none absolute z-20 ${
                                    decoration % 2 === 0
                                    ? '-left-2 top-3'
                                    : '-right-2 top-4'
                                }`}
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
                                    <Flower2 size={34} strokeWidth={1.7} />
                                </div>
                                </motion.div>

                                {/* Hoja */}
                                <motion.div
                                aria-hidden="true"
                                className={`pointer-events-none absolute bottom-2 z-20 text-green-500 ${
                                    decoration % 2 === 0
                                    ? '-right-2'
                                    : '-left-2'
                                }`}
                                variants={{
                                    rest: {
                                    rotate: -20,
                                    scale: 1,
                                    },
                                    hover: {
                                    rotate: 20,
                                    scale: 1.2,
                                    },
                                }}
                                transition={squishyTransition}
                                >
                                <Leaf size={40} strokeWidth={1.7} />
                                </motion.div>

                                {/* Destello */}
                                <motion.div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-1 top-1/2 z-20 text-link"
                                variants={{
                                    rest: {
                                    scale: 0.8,
                                    opacity: 0.7,
                                    rotate: 0,
                                    },
                                    hover: {
                                    scale: 1.3,
                                    opacity: 1,
                                    rotate: 30,
                                    },
                                }}
                                transition={squishyTransition}
                                >
                                <Sparkles size={26} />
                                </motion.div>

                                {/* Fotografía circular */}
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

                            {/* Información del docente */}
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
                        )
                        })}
                    </div>
                    </div>
                )}

                {/* Sin docentes */}
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
