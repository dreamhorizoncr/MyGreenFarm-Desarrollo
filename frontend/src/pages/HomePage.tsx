import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'

function HomePage() {
  const { t } = useTranslation()

  return (
    <section id="home">
      <LanguageSwitcher />
      <h1>{t('app.title')}</h1>
    </section>
  )
}

export default HomePage
