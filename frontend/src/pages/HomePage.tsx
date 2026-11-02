import Navbar from '../components/Navbar.tsx'
import HeaderSection from './home/HeaderSection.tsx'
import PhilosophySection from './home/PhilosophySection.tsx'
import TestimonialsSection from './home/TestimonialsSection.tsx'
import MultimediaSection from './home/MultimediaSection.tsx'
import JoinSection from './home/JoinSection.tsx'
import { setPageSEO } from '../utils/seo.ts'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function HomePage() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    setPageSEO({
      title: `My Green Farm | ${t('home.header.badge')}`,
      description: t('home.header.description'),
    })
  }, [t, i18n.resolvedLanguage])

  return (
    <>
      <Navbar />

      <main className="flex flex-col">
        <HeaderSection />
        <PhilosophySection />
        <TestimonialsSection />
        <MultimediaSection />
        <JoinSection />
      </main>
    </>
  )
}

export default HomePage
