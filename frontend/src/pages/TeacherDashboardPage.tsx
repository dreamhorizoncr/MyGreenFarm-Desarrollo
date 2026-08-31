import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import { userStorage } from '../utils/userStorage.ts'

function TeacherDashboardPage() {
  const { t } = useTranslation()
  const user = userStorage.getUser()

  return (
    <>
      <Navbar variant="panel" />

      <section id="teacher-dashboard" className="teacher-dashboard">
        <h1>
          {t('teacherDashboard.hello')}, {user?.firstName}!
        </h1>
        <p className="teacher-dashboard__subtitle">{t('teacherDashboard.subtitle')}</p>
      </section>
    </>
  )
}

export default TeacherDashboardPage