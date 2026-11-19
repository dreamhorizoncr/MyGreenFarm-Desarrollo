import AdminLayout from '../../layout/AdminLayout.tsx'
import AppointmentsSection from '../../components/appointments/AppointmentsSection.tsx'

/** Admin page of the visit appointments. */
function AdminAppointmentsPage() {
  return (
    <AdminLayout>
      <AppointmentsSection />
    </AdminLayout>
  )
}

export default AdminAppointmentsPage