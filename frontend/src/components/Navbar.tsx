import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, Menu, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher.tsx'
import ProfileButton from './ProfileButton.tsx'
import { userStorage } from '../utils/userStorage.ts'
import logo from '../assets/imgs/Logo.svg'

function Brand() {
  const isAdminSection = useLocation().pathname.startsWith('/admin')

  return (
    <Link
      to={isAdminSection ? '/admin/dashboard' : '/'}
      className="flex items-center gap-3 no-underline"
    >
      <img src={logo} alt="My Green Farm" className="h-12 w-auto max-w-[48px] object-contain" />
      <span className="font-heading text-h6 text-heading">My Green Farm</span>
    </Link>
  )
}

function Navbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isAuthenticated = Boolean(userStorage.getUser())
  const isProtectedPage =
    pathname === '/profile' ||
    pathname.startsWith('/admin')

  const navLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/news', label: t('navbar.news') },
    { to: '/multimedia', label: t('navbar.multimedia') },
    { to: '/forum', label: t('navbar.forum') },
    { to: '/services', label: t('navbar.services') },
  ]

  return (
    <header className="relative z-40 h-16 border-b border-neutral-200 bg-bg-page">
      {/* Desktop nav */}
      <nav className="hidden h-full w-full lg:flex">
        <div className="mx-auto flex h-full w-full max-w-[var(--container-max-width)] items-center px-[var(--scale-1100)]">
          <Brand />

          <div className="ml-auto flex items-center gap-7 font-link">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:bg-green-500 after:transition-all after:content-[''] ${
                  pathname === link.to ? 'after:w-full' : 'after:w-0'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <LanguageSwitcher />

            {(!isAuthenticated || !isProtectedPage) && (
              <Link
                to="/login"
                aria-label={t('navbar.adminLogin')}
                title={t('navbar.adminLogin')}
className="w-fit self-center text-green-500 transition-opacity hover:opacity-70"
              >
                <Lock size={18} aria-hidden="true" />
              </Link>
            )}

            {isAuthenticated && isProtectedPage && <ProfileButton />}
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <nav className="flex h-full w-full lg:hidden">
        <div className="mx-auto flex h-full w-full max-w-[var(--container-max-width)] items-center justify-between px-lg">
          <Brand />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-heading"
              aria-label="Open menu"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[60] h-dvh w-[280px] overflow-y-auto bg-bg-page transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <Brand />

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="text-heading"
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
        </div>

        <nav className="flex flex-col items-center gap-6 px-6 pt-6 font-link">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative w-fit font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:bg-green-500 after:transition-all after:content-[''] ${
                pathname === link.to ? 'after:w-full' : 'after:w-0'
              }`}
              onClick={() => setDrawerOpen(false)}
            >
              {link.label}
            </Link>
          ))}
{(!isAuthenticated || !isProtectedPage) && (
            <Link
              to="/login"
              aria-label={t('navbar.adminLogin')}
              title={t('navbar.adminLogin')}
              onClick={() => setDrawerOpen(false)}
              className="text-green-500 transition-opacity hover:opacity-70"
            >
              <Lock size={18} aria-hidden="true" />
            </Link>
          )}
        </nav>

        {isAuthenticated && isProtectedPage && (
          <div className="px-6 pt-8">
            <ProfileButton />
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar