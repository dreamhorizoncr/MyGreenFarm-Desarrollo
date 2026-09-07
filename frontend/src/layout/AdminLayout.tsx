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

      <div className="flex w-full flex-1 flex-col items-stretch md:flex-row md:items-start">
        <AdminSidebar />

        <main className="min-w-0 flex-1 bg-bg-page px-[var(--scale-1100)] pb-[var(--scale-1200)] pt-[var(--scale-600)] text-left md:pb-[var(--scale-1500)] md:pt-[var(--scale-1000)]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout