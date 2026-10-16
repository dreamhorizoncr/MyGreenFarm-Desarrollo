import type { ReactNode } from 'react'
import Navbar from '../components/Navbar.tsx'
import AdminSidebar from '../components/AdminSidebar.tsx'
import Footer from './Footer.tsx'

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <Navbar />

      <div id="admin-scroll-container" className="flex-1 overflow-y-auto overscroll-y-contain bg-bg-page">
        <div className="flex w-full flex-col items-stretch md:min-h-full md:flex-row md:pl-[260px]">
          <AdminSidebar />

          <main className="min-w-0 flex-1">
            <div className="px-[var(--scale-1100)] pb-[var(--scale-1200)] pt-[var(--scale-600)] text-left md:pb-[var(--scale-1500)] md:pt-[var(--scale-1000)]">
              {children}
            </div>
          </main>
        </div>

        <div className="md:pl-[260px]">
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout