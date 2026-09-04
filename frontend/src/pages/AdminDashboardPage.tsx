import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'

function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <AdminLayout>
      <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
        {t('admin.dashboard.title')}
      </h1>
      <p className="mt-2 font-body text-base text-neutral-500">
        {t('admin.dashboard.subtitle')}
      </p>
    </AdminLayout>
  )
}

export default AdminDashboardPage