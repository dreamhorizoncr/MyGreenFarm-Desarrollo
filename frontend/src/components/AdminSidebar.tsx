import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useLogin } from '../hooks/useLogin.ts'

type SidebarItemId = 'dashboard' | 'docentes' | 'cv' | 'expedientes' | 'miPerfil'

interface SidebarItem {
  id: SidebarItemId
  icon: LucideIcon
  path?: string
}

function AdminSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useLogin()
  const { pathname } = useLocation()

  const items: SidebarItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'docentes', icon: GraduationCap, path: '/admin/users' },
    { id: 'cv', icon: FileText },
    { id: 'expedientes', icon: FolderOpen },
    { id: 'miPerfil', icon: User },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const itemClasses =
    'flex w-full shrink-0 items-center gap-sm rounded-full px-md py-sm text-left font-body text-[15px] font-semibold text-body-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2'

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-x-auto bg-bg-page p-md md:w-[260px] md:overflow-hidden md:py-lg">
      <nav className="flex flex-1 flex-row gap-sm md:flex-col">
        {items.map(({ id, icon: Icon, path }) => {
          const isActive = path === pathname
          const label = t(`admin.sidebar.${id}`)
          const className = `${itemClasses}${isActive ? ' bg-heading text-white' : ''}`

          return path ? (
            <Link
              key={id}
              to={path}
              className={className}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </Link>
          ) : (
            <button
              key={id}
              type="button"
              className={className}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </button>
          )
        })}

        <button
          type="button"
          className={`${itemClasses} mt-auto text-danger`}
          onClick={handleLogout}
        >
          <span
            className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-danger"
            aria-hidden="true"
          >
            <LogOut size={18} />
          </span>
          <span>{t('profile.logout')}</span>
        </button>
      </nav>
    </aside>
  )
}

export default AdminSidebar