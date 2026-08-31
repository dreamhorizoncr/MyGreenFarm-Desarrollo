import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'

function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <AdminLayout>
      <h1 className="admin-page-title">{t('admin.dashboard.title')}</h1>
      <p className="admin-page-subtitle">{t('admin.dashboard.subtitle')}</p>
    </AdminLayout>
  )
}

export default AdminDashboardPage