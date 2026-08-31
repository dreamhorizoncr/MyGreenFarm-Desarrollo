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

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar__nav">
        {items.map(({ id, icon: Icon, path }) => {
          const isActive = path === pathname
          const label = t(`admin.sidebar.${id}`)
          const className = `admin-sidebar__item${isActive ? ' admin-sidebar__item--active' : ''}`

          return path ? (
            <Link
              key={id}
              to={path}
              className={className}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="admin-sidebar__icon" aria-hidden="true">
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
              <span className="admin-sidebar__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </button>
          )
        })}

        <button
          type="button"
          className="admin-sidebar__item admin-sidebar__item--logout"
          onClick={handleLogout}
        >
          <span className="admin-sidebar__icon" aria-hidden="true">
            <LogOut size={18} />
          </span>
          <span>{t('profile.logout')}</span>
        </button>
      </nav>
    </aside>
  )
}

export default AdminSidebar