import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userStorage } from '../utils/userStorage.ts'

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

  return (
    <nav
      aria-label={t('admin.sidebar.niños')}
      className="mb-8 flex w-full max-w-full gap-2 overflow-x-auto rounded-2xl sm:rounded-full border border-neutral-200 bg-white p-1.5 sm:w-fit sm:p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`shrink-0 whitespace-nowrap rounded-xl sm:rounded-full px-3 py-1.5 text-center font-body text-xs sm:px-4 sm:py-2 sm:text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
                isActive
                  ? 'bg-heading text-white shadow-xs'
                  : 'text-body-text hover:bg-(--grey-100)'
              }`}
            >
              {t(labelKey)}
            </Link>
          )
        })}
    </nav>
  )
}

export default ChildrenModuleTabs