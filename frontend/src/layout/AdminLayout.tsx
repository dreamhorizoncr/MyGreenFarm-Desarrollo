import type { ReactNode } from 'react'
import Navbar from '../components/Navbar.tsx'
import AdminSidebar from '../components/AdminSidebar.tsx'

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <div className="flex flex-1 flex-col items-stretch md:flex-row">
        <AdminSidebar />

        <main className="min-w-0 flex-1 bg-bg-page px-[var(--spacing-md)] pb-[var(--scale-1200)] pt-[var(--scale-600)] md:px-[var(--scale-1100)] md:pb-[var(--scale-1500)] md:pt-[var(--scale-1000)]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout