import type { ReactNode } from 'react'
import Navbar from '../components/Navbar.tsx'
import AdminSidebar from '../components/AdminSidebar.tsx'

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <Navbar variant="panel" />

      <div className="admin-shell__body">
        <AdminSidebar />

        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout