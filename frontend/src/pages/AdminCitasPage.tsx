import AdminLayout from '../layout/AdminLayout.tsx'
import AppointmentsSection from '../components/AppointmentsSection.tsx'

function AdminCitasPage() {
  return (
    <AdminLayout>
      <div className="mt-[var(--spacing-lg)]">
        <AppointmentsSection />
      </div>
    </AdminLayout>
  )
}

export default AdminCitasPage