
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Sprout, Heart, Leaf, UsersRound, UserRound, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'

import { adminService } from '../services/admin.ts'
import type { UserInfo } from '../types/auth.ts'

import kids from '../assets/imgs/news2.png'
import nino from '../assets/imgs/nino.svg'
import ninos2 from '../assets/imgs/ninos2.svg'
import headerImage from '../assets/imgs/LowCortisol.png'

    const benefits = [
    {
        image: ninos2,
        translationKey: 'nature',
        shape: 'square',
        color: 'blue',
        icon: Sprout,
    },
    {
        image: kids,
        translationKey: 'creativity',
        shape: 'circle',
        color: 'pink',
        icon: Heart,
    },
    {
        image: headerImage,
        translationKey: 'educators',
        shape: 'square',
        color: 'blue',
        icon: UsersRound,
    },
    {
        image: nino,
        translationKey: 'growth',
        shape: 'circle',
        color: 'pink',
        icon: Leaf,
    },
    ] as const

    const squishyTransition = {
    type: 'spring' as const,
    stiffness: 180,
    damping: 12,
    mass: 0.9,
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
            setTeachers(data.filter((user) => user.role === 'TEACHER'))
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

    // Cargar al entrar a la página
    void loadTeachers()

    // Actualizar cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
        void loadTeachers()
        }
    }

    // Actualizar cuando la ventana recupera el foco
    const handleFocus = () => {
        void loadTeachers()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
        active = false
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
    }
    }, [])


    return (
        <>
        <Navbar />

        <main className="flex min-w-0 flex-col bg-bg-page">
            {/* About Us */}
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

            {/* Why Choose Us */}
            <section
            id="why-choose-us"
            className="relative w-full overflow-hidden"
            >
            <Container className="relative flex flex-col items-center gap-xl py-1000 sm:py-1200 lg:py-1500">
                {/* Encabezado */}
                <div className="flex w-full max-w-[55rem] flex-col items-center gap-700 text-center">
                <h2 className="m-0 font-heading text-h2 font-bold leading-tight text-heading">
                    {t('aboutUsPage.benefits.title')}
                </h2>

                <p className="m-0 max-w-[48rem] font-body text-body-sm font-normal leading-[1.6] text-body-text">
                    {t('aboutUsPage.benefits.description')}
                </p>
                </div>

                {/* Beneficios */}
                <div className="relative w-full pt-md sm:pt-lg lg:pt-xl">
                {/* Línea decorativa */}
                <div
                    className="pointer-events-none absolute left-[-15%] right-[-15%] top-[8.5rem] hidden border-t-[3px] border-dashed border-pink-400 lg:block"
                    aria-hidden="true"
                />

                <div className="relative grid w-full grid-cols-1 justify-items-center gap-x-lg gap-y-xl sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-md xl:gap-x-lg">
                    {benefits.map((benefit, index) => {
                    const Icon = benefit.icon
                    const isCircle = benefit.shape === 'circle'
                    const isPink = benefit.color === 'pink'

                    const borderColor = isPink
                        ? 'border-pink-400'
                        : 'border-sky-400'

                    const iconColor = isPink
                        ? 'bg-pink-400'
                        : 'bg-sky-400'

                    const backgroundColor = isPink
                        ? '#F472B6'
                        : '#38BDF8'

                    const rotation = isCircle
                        ? 0
                        : index === 0
                        ? -8
                        : 8

                    const titleKey =
                        `aboutUsPage.benefits.${benefit.translationKey}.title` as const

                    const descriptionKey =
                        `aboutUsPage.benefits.${benefit.translationKey}.description` as const

                    return (
                        <motion.article
                        key={benefit.translationKey}
                        initial="rest"
                        animate="rest"
                        whileHover={reduceMotion ? undefined : 'hover'}
                        variants={{
                            rest: {
                            scale: 1,
                            y: 0,
                            },
                            hover: {
                            scale: 1.035,
                            y: -6,
                            },
                        }}
                        transition={squishyTransition}
                        className="group relative z-0 flex w-full max-w-[19rem] min-w-0 flex-col items-center gap-md text-center hover:z-10"
                        >
                        {/* Fotografía */}
                        <div className="relative flex h-52 w-52 shrink-0 items-center justify-center sm:h-48 sm:w-48 lg:h-44 lg:w-44 xl:h-52 xl:w-52">
                            {/* Formas Squishy */}
                            <motion.svg
                            viewBox="0 0 220 220"
                            fill="none"
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                            variants={{
                                rest: {
                                scale: 0.75,
                                opacity: 0,
                                rotate: 0,
                                },
                                hover: {
                                scale: 1.18,
                                opacity: 0.35,
                                rotate: 12,
                                },
                            }}
                            transition={squishyTransition}
                            >
                            <motion.circle
                                cx="110"
                                cy="75"
                                r="58"
                                fill={backgroundColor}
                                variants={{
                                rest: {
                                    scaleY: 1,
                                    y: 0,
                                },
                                hover: {
                                    scaleY: 0.55,
                                    y: -24,
                                },
                                }}
                                transition={squishyTransition}
                            />

                            <motion.ellipse
                                cx="110"
                                cy="155"
                                rx="62"
                                ry="30"
                                fill={backgroundColor}
                                variants={{
                                rest: {
                                    scaleY: 1,
                                    y: 0,
                                },
                                hover: {
                                    scaleY: 2.2,
                                    y: 14,
                                },
                                }}
                                transition={squishyTransition}
                            />
                            </motion.svg>

                            {/* Marco */}
                            <motion.div
                            variants={{
                                rest: {
                                rotate: rotation,
                                scale: 1,
                                y: 0,
                                },
                                hover: {
                                rotate: isCircle ? 0 : -rotation,
                                scale: 1.07,
                                y: -6,
                                },
                            }}
                            transition={squishyTransition}
                            className={`relative z-10 h-[88%] w-[88%] border-[3px] border-dashed bg-white p-2 shadow-sm ${borderColor} ${
                                isCircle ? 'rounded-full' : 'rounded-md'
                            }`}
                            >
                            <div
                                className={`h-full w-full overflow-hidden ${
                                isCircle ? 'rounded-full' : 'rounded-sm'
                                }`}
                            >
                                <motion.img
                                src={benefit.image}
                                alt={t(titleKey)}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                variants={{
                                    rest: {
                                    scale: 1,
                                    },
                                    hover: {
                                    scale: 1.12,
                                    },
                                }}
                                transition={squishyTransition}
                                />
                            </div>
                            </motion.div>

                            {/* Ícono decorativo */}
                            <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2">
                            <motion.div
                                variants={{
                                rest: {
                                    scale: 1,
                                    y: 0,
                                    rotate: 0,
                                },
                                hover: {
                                    scale: 1.2,
                                    y: -8,
                                    rotate: 12,
                                },
                                }}
                                transition={squishyTransition}
                                className={`flex size-11 items-center justify-center rounded-full border-[3px] border-[#E8F7FC] text-white sm:size-12 ${iconColor}`}
                            >
                                <Icon
                                size={21}
                                strokeWidth={1.8}
                                aria-hidden="true"
                                />
                            </motion.div>
                            </div>
                        </div>

                        {/* Información */}
                        <div className="relative z-10 flex w-full flex-col items-center gap-sm">
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
                            className="m-0 font-heading text-h5 font-bold uppercase leading-snug text-heading"
                            >
                            {t(titleKey)}
                            </motion.h3>

                            <p className="m-0 max-w-[17rem] font-body text-body-sm font-normal leading-[1.6] text-body-text">
                            {t(descriptionKey)}
                            </p>
                        </div>
                        </motion.article>
                    )
                    })}
                </div>
                </div>
            </Container>
            </section>

            {/* Meet Our Team */}
            <section
            id="meet-our-team"
            className="relative w-full overflow-hidden"
            >
            <Container className="flex flex-col gap-xl py-1000 sm:py-1200 lg:py-1500">
                {/* Encabezado */}
                <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center gap-700 text-center">
                <h2 className="m-0 font-heading text-h2 font-bold leading-tight text-heading">
                    {t('aboutUsPage.team.title')}
                </h2>

                <p className="m-0 max-w-[38rem] font-body text-body-sm leading-[1.6] text-body-text">
                    {t('aboutUsPage.team.description')}
                </p>
                </div>

                {/* Cargando */}
                {teachersLoading && (
                <div className="grid w-full grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="flex animate-pulse flex-col items-center gap-md rounded-3xl bg-[var(--grey-100)] px-lg py-1000"
                    >
                        <div className="size-40 rounded-full bg-neutral-200 sm:size-44" />
                        <div className="h-5 w-40 rounded bg-neutral-200" />
                        <div className="h-4 w-24 rounded bg-neutral-200" />
                    </div>
                    ))}
                </div>
                )}

                {/* Error */}
                {!teachersLoading && teachersError && (
                <div className="w-full rounded-3xl bg-[var(--grey-100)] px-lg py-1000 text-center">
                    <p className="m-0 font-body text-body-sm text-body-text">
                    {t('aboutUsPage.team.placeholderDescription')}
                    </p>
                </div>
                )}

                {/* Carrusel de docentes */}
                {!teachersLoading && !teachersError && teachers.length > 0 && (
                <div className="relative w-full min-w-0">
                    <Swiper
                    modules={[Navigation, Pagination, A11y]}
                    navigation={{
                        prevEl: '.team-swiper-prev',
                        nextEl: '.team-swiper-next',
                    }}
                    pagination={{
                        clickable: true,
                        dynamicBullets: true,
                    }}
                    spaceBetween={20}
                    slidesPerView={1}
                    watchOverflow
                    breakpoints={{
                        640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                        },
                        1024: {
                        slidesPerView: 3,
                        spaceBetween: 28,
                        },
                    }}
                    className="w-full !pb-14"
                    >
                    {teachers.map((teacher) => (
                        <SwiperSlide
                        key={teacher.id}
                        className="!h-auto"
                        >
                        <article className="flex h-full min-w-0 flex-col items-center gap-md rounded-3xl bg-[var(--grey-100)] px-md py-1000 text-center transition-transform duration-300 hover:-translate-y-1 sm:px-lg">
                            {/* Fotografía circular */}
                            <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-white text-green-500 shadow-md sm:size-44 lg:size-48">
                            {teacher.photoUrl ? (
                                <img
                                src={teacher.photoUrl}
                                alt={`${teacher.firstName} ${teacher.lastName}`}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                                />
                            ) : (
                                <UserRound
                                size={76}
                                strokeWidth={1.3}
                                aria-hidden="true"
                                />
                            )}
                            </div>

                            {/* Información */}
                            <div className="flex w-full min-w-0 flex-col items-center gap-sm">
                                <h3 className="m-0 w-full break-words font-heading text-h5 font-bold leading-snug text-heading">
                                    {teacher.firstName} {teacher.lastName}
                                </h3>

                                <p className="m-0 font-body text-body-sm text-body-text">
                                    {t(`aboutUsPage.team.roles.${teacher.role}`, {
                                        defaultValue: teacher.role,
                                    })}
                                </p>
                            </div>
                        </article>
                        </SwiperSlide>
                    ))}
                    </Swiper>

                    {/* Navegación */}
                    {teachers.length > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-md">
                        <button
                        type="button"
                        className="team-swiper-prev flex size-11 items-center justify-center rounded-full border border-green-500 bg-white text-green-500 transition hover:bg-green-500 hover:text-white disabled:opacity-30"
                        aria-label="Anterior"
                        >
                        <ChevronLeft size={22} aria-hidden="true" />
                        </button>

                        <button
                        type="button"
                        className="team-swiper-next flex size-11 items-center justify-center rounded-full border border-green-500 bg-white text-green-500 transition hover:bg-green-500 hover:text-white disabled:opacity-30"
                        aria-label="Siguiente"
                        >
                        <ChevronRight size={22} aria-hidden="true" />
                        </button>
                    </div>
                    )}
                </div>
                )}

                {/* Sin docentes */}
                {!teachersLoading && !teachersError && teachers.length === 0 && (
                <div className="flex w-full flex-col items-center gap-md rounded-3xl bg-[var(--grey-100)] px-md py-1000 text-center sm:px-lg lg:py-1500">
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white text-green-500 sm:size-24">
                    <UserRound
                        size={44}
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                    </div>

                    <h3 className="m-0 font-heading text-h5 font-bold text-heading">
                    {t('aboutUsPage.team.placeholderTitle')}
                    </h3>

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
