import type { ReactNode } from 'react'
import Navbar from '../components/navigation/Navbar.tsx'
import AdminSidebar from '../components/navigation/AdminSidebar.tsx'
import Footer from './Footer.tsx'

/** Props of {@link AdminLayout}. */
interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Frame of the admin pages: navigation bar, sidebar, and the page in a container that scrolls on its
 * own (`admin-scroll-container`).
 */
function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <Navbar />

      <div id="admin-scroll-container" className="relative flex-1 overflow-y-auto overscroll-y-contain bg-bg-page">
        <div className="flex w-full flex-col items-stretch md:min-h-full md:flex-row">
          <AdminSidebar />

          <main className="min-w-0 flex-1">
            <div className="px-[var(--scale-1100)] pb-[var(--scale-1200)] pt-[var(--scale-600)] text-left md:pb-[var(--scale-1500)] md:pt-[var(--scale-1000)]">
              {children}
            </div>
          </main>
        </div>

        <div className="relative z-40">
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout