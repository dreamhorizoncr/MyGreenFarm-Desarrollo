import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userStorage } from '../utils/userStorage.ts'
import TabHighlight from './ui/TabHighlight.tsx'
import { tabCarouselClass, useTabCarousel } from '../hooks/useTabCarousel.ts'

const moduleSections = [
  { path: '/admin/children', labelKey: 'admin.children.title', adminOnly: true },
  { path: '/admin/expedients', labelKey: 'admin.expedients.title', adminOnly: false },
  { path: '/admin/evaluations', labelKey: 'admin.evaluations.title', adminOnly: false },
] as const

function ChildrenModuleTabs() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const role = userStorage.getUser()?.role
  const isAdmin = role === 'OWNER' || role === 'ADMIN'
  const navRef = useTabCarousel<HTMLElement>(pathname)

  return (
    <nav
      ref={navRef}
      aria-label={t('admin.sidebar.niños')}
      className={`${tabCarouselClass} mt-[calc(var(--spacing-lg)-4px)]`}
    >
      {moduleSections
        .filter((section) => isAdmin || !section.adminOnly)
        .map(({ path, labelKey }) => {
          const isActive = pathname === path

          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative shrink-0 whitespace-nowrap rounded-full border px-md py-xs font-body text-body-sm transition duration-300 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
                isActive
                  ? 'border-green-500 text-white'
                  : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
              }`}
            >
              {isActive && <TabHighlight layoutId="children-module-tab" className="bg-green-500" />}
              {t(labelKey)}
            </Link>
          )
        })}
    </nav>
  )
}

export default ChildrenModuleTabs