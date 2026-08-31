import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import { userStorage } from '../utils/userStorage.ts'

function TeacherDashboardPage() {
  const { t } = useTranslation()
  const user = userStorage.getUser()

  return (
    <>
      <Navbar />

      <section
        id="teacher-dashboard"
        className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center gap-xs px-[var(--scale-1100)] pb-[var(--scale-1500)] pt-[var(--scale-1000)]"
      >
        <h1>
          {t('teacherDashboard.hello')}, {user?.firstName}!
        </h1>
        <p className="m-0 font-body text-body text-body-text-light">
          {t('teacherDashboard.subtitle')}
        </p>
      </section>
    </>
  )
}

export default TeacherDashboardPage