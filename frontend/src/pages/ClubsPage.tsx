import { useTranslation } from 'react-i18next'
import { UsersIcon, SparklesIcon } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'

function ClubsPage() {
    const { t } = useTranslation()

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

            {/* Main Content - Coming Soon */}
            <main className="flex flex-1 items-center justify-center">
                <Container className="py-12 md:py-20">
                    <div className="mx-auto max-w-140 rounded-3xl border border-neutral-200 bg-white p-xl text-center shadow-md md:p-2xl">
                        {/* Ícono Grande con efecto sutil y Badge circular perfecto */}
                        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                            <UsersIcon size={56} aria-hidden="true" />
                            <div className="absolute -right-1 -top-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                                <SparklesIcon size={20} aria-hidden="true" />
                            </div>
                        </div>

                        {/* Mensaje Próximamente */}
                        <h2 className="mt-xl font-heading text-2xl font-bold leading-snug text-heading md:text-3xl">
                            {t('clubs.comingSoonTitle')}
                        </h2>

                        <p className="mt-md font-body text-body text-body-text leading-relaxed">
                            {t('clubs.comingSoonDescription')}
                        </p>

                        {/* Indicador de Estado */}
                        <div className="mt-lg inline-flex items-center gap-xs rounded-full bg-neutral-100 px-md py-xs text-caption font-semibold text-neutral-600">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            {t('clubs.statusTag')}
                        </div>
                    </div>
                </Container>
            </main>
        </div>
    )
}

export default ClubsPage