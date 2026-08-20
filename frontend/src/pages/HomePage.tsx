import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import ProfileButton from '../components/ProfileButton.tsx'

function HomePage() {
  const { t } = useTranslation()

  return (
    <section id="home">
      <div className="home-header">
        <LanguageSwitcher />
        <ProfileButton />
      </div>
      <h1>{t('app.title')}</h1>
    </section>
  )
}

export default HomePage
