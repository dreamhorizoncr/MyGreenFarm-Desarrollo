import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenTextIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CreditCardIcon,
  FileTextIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MegaphoneIcon,
  MessageSquarePlusIcon,
  UserIcon,
  UsersIcon,
  UserStarIcon,
  ContactRoundIcon,
  MailPlus,
  SparklesIcon
} from '@animateicons/react/lucide'
import { useLogin } from '../hooks/useLogin.ts'
import useDismiss from '../hooks/useDismiss.ts'
import { useProfileAvatar } from '../contexts/ProfileAvatarContext.tsx'
import { notify } from '../utils/notifications.ts'
import { userStorage } from '../utils/userStorage.ts'

type SidebarItemId =
  | "dashboard"
  | "citas"
  | "docentes"
  | "profesores"
  | "noticias"
  | "galeria"
  | "cv"
  | "clubs"
  | "padres"
  | "niños"
  | "miPerfil"
  | "servicios"
  | "disponibilidad"
  | "foro"
  | "boletín";

interface SidebarItem {
  id: SidebarItemId;
  icon: ComponentType<{ size?: number; className?: string }>;
  path?: string;
}

const SIDEBAR_SCROLL_KEY = 'admin-sidebar-scroll-top'
const CHILDREN_MODULE_PATHS = new Set(['/admin/children', '/admin/expedients', '/admin/evaluations'])
let lastFilledKey: string | null = null

function AdminSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useLogin()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const asideRef = useRef<HTMLElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const closeMobileMenu = useCallback(() => setOpen(false), [])
  useDismiss({ ref: mobileMenuRef, isOpen: open, onClose: closeMobileMenu })

  const activeKey = CHILDREN_MODULE_PATHS.has(pathname) ? 'niños' : pathname
  const [filled, setFilled] = useState(() => activeKey === lastFilledKey)
  useEffect(() => {
    lastFilledKey = activeKey
    if (filled) return
    const frame = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(frame)
  }, [activeKey, filled])

  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY)
    if (saved && asideRef.current) {
      asideRef.current.scrollTop = Number(saved)
    }
  }, [])

  const handleScroll = () => {
    if (asideRef.current) {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(asideRef.current.scrollTop))
    }
  }

  const { setSidebarHovered } = useProfileAvatar()

  const role = userStorage.getUser()?.role
  const ownerItems: SidebarItem[] = [
    { id: 'dashboard', icon: LayoutDashboardIcon, path: '/admin/dashboard' },
    { id: 'citas', icon: CalendarDaysIcon, path: '/admin/citas' },
    { id: 'noticias', icon: MegaphoneIcon, path: '/admin/announcements' },
    { id: 'galeria', icon: ImageIcon, path: '/admin/gallery' },
    { id: 'docentes', icon: ContactRoundIcon, path: '/admin/users' },
    { id: 'profesores', icon: BookOpenTextIcon, path: '/admin/teachers' },
    { id: 'servicios', icon: CreditCardIcon, path: '/admin/service-plans' },
    { id: 'disponibilidad', icon: CalendarDaysIcon, path: '/admin/disponibilidad' },
    { id: 'foro', icon: MessageSquarePlusIcon, path: '/admin/forum' },
    { id: 'cv', icon: FileTextIcon, path: '/admin/curriculums' },
    { id: 'clubs', icon: SparklesIcon, path: '/admin/clubs' },
    { id: 'padres', icon: UsersIcon, path: '/admin/parents'},
    { id: 'niños', icon: UserStarIcon, path: '/admin/children' },
    { id: 'boletín', icon: MailPlus, path: '/admin/newsletter' },
    { id: 'miPerfil', icon: UserIcon, path: '/profile' },
  ]
  const adminItems: SidebarItem[] = [
    { id: 'dashboard', icon: LayoutDashboardIcon, path: '/admin/dashboard' },
    { id: 'citas', icon: CalendarDaysIcon, path: '/admin/citas' },
    { id: 'noticias', icon: MegaphoneIcon, path: '/admin/announcements' },
    { id: 'galeria', icon: ImageIcon, path: '/admin/gallery' },
    { id: 'docentes', icon: ContactRoundIcon, path: '/admin/users' },
    { id: 'profesores', icon: BookOpenTextIcon, path: '/admin/teachers' },
    { id: 'cv', icon: FileTextIcon, path: '/admin/curriculums' },
    { id: 'padres', icon: UsersIcon, path: '/admin/parents'},
    { id: 'niños', icon: UserStarIcon, path: '/admin/children' },
    { id: 'miPerfil', icon: UserIcon, path: '/profile' },
  ]
  const teacherItems: SidebarItem[] = [
    { id: 'dashboard', icon: LayoutDashboardIcon, path: '/admin/dashboard' },
    { id: 'niños', icon: UserStarIcon, path: '/admin/expedients' },
    { id: 'foro', icon: MessageSquarePlusIcon, path: '/admin/forum' },
    { id: 'miPerfil', icon: UserIcon, path: '/profile' },
  ]
  const itemsByRole: Record<string, SidebarItem[]> = { OWNER: ownerItems, ADMIN: adminItems }
  const items = itemsByRole[role ?? ''] ?? teacherItems

  const isChildrenModulePath = CHILDREN_MODULE_PATHS.has(pathname)
  const activeItem =
    items.find((item) => item.path === pathname) ??
    (isChildrenModulePath ? items.find((item) => item.id === 'niños') : undefined) ??
    items[0]
  const ActiveIcon = activeItem.icon

  const handleLogout = async () => {
    await logout()
    notify.success(t('profile.logoutToastTitle'))
    navigate('/login')
  }

  const itemClasses =
    'relative flex shrink-0 items-center gap-sm overflow-hidden rounded-full px-md py-sm text-left font-body text-body-sm font-semibold text-body-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 md:w-full'

  const activeFillClasses =
    'absolute inset-0 origin-left bg-heading transition-transform duration-300 ease-out'

  return (
    <aside
      ref={asideRef}
      onScroll={handleScroll}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
      onFocus={() => setSidebarHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setSidebarHovered(false)
        }
      }}
      className="w-full shrink-0 bg-bg-page px-[var(--scale-1100)] pt-md md:sticky md:top-0 md:z-30 md:h-[calc(100svh-4rem)] md:self-start md:px-md md:flex md:w-[260px] md:flex-col md:gap-sm md:overflow-y-auto md:py-lg"
    >
      <div ref={mobileMenuRef} className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-full bg-heading px-md py-sm font-body text-body-sm font-semibold text-white"
          aria-expanded={open}
        >
          <span className="flex items-center gap-sm">
            <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-white text-heading">
              <ActiveIcon size={18} />
            </span>

            {t(`admin.sidebar.${activeItem.id}`)}
          </span>

          <ChevronDownIcon
            size={18}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <nav className="mt-sm flex flex-col gap-xs rounded-2xl bg-white p-sm shadow">
            {items.map(({ id, icon: Icon, path }) => {
              const isActive = path === pathname || (id === 'niños' && isChildrenModulePath);
              const label = t(`admin.sidebar.${id}`);

              return path ? (
                <Link
                  key={id}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={`${itemClasses}${
                    isActive && filled ? " text-white" : " hover:bg-(--grey-100)"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    aria-hidden="true"
                    className={`${activeFillClasses} ${isActive && filled ? "scale-x-100" : "scale-x-0"}`}
                  />

                  <span
                    className="relative z-10 inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  <span className="relative z-10">{label}</span>
                </Link>
              ) : (
                <button key={id} type="button" className={`${itemClasses} hover:bg-(--grey-100)`}>
                  <span
                    className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  <span>{label}</span>
                </button>
              );
            })}

            <button
              type="button"
              className={`${itemClasses} text-danger hover:bg-danger-100`}
              onClick={handleLogout}
            >
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-danger"
                aria-hidden="true"
              >
                <LogOutIcon size={18} />
              </span>

              <span>{t("profile.logout")}</span>
            </button>
          </nav>
        )}
      </div>

      <nav className="hidden flex-1 flex-col gap-sm md:flex">
        {items.map(({ id, icon: Icon, path }) => {
          const isActive = path === pathname || (id === 'niños' && isChildrenModulePath);
          const label = t(`admin.sidebar.${id}`);
          const className = `${itemClasses}${
            isActive && filled ? " text-white" : " hover:bg-(--grey-100)"
          }`;

          return path ? (
            <Link
              key={id}
              to={path}
              className={className}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                aria-hidden="true"
                className={`${activeFillClasses} ${isActive && filled ? "scale-x-100" : "scale-x-0"}`}
              />

              <span
                className="relative z-10 inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>

              <span className="relative z-10">{label}</span>
            </Link>
          ) : (
            <button key={id} type="button" className={className}>
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>

              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className={`${itemClasses} hidden text-danger hover:bg-danger-100 md:mt-auto md:flex`}
        onClick={handleLogout}
      >
        <span
          className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-danger"
          aria-hidden="true"
        >
          <LogOutIcon size={18} />
        </span>

        <span>{t('profile.logout')}</span>
      </button>
    </aside>
  );
}

export default AdminSidebar;
