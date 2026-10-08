import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LockIcon, MenuIcon, XIcon } from '@animateicons/react/lucide'
import LanguageSwitcher from './LanguageSwitcher.tsx'
import ProfileButton from './ProfileButton.tsx'
import { userStorage } from '../utils/userStorage.ts'
import logo from '../assets/imgs/Logo.svg'
import { authService } from '../services/auth.ts'
import { tokenStorage } from '../utils/token.ts'

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
  const navigate = useNavigate()
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
    { to: '/vacantes', label: t('navbar.vacancies') },
    { to: '/clubs', label: t('navbar.clubs') },
  ]

  const handleLogout = async () => {
    await authService.signout()

    tokenStorage.clear()
    userStorage.clear()

    setDrawerOpen(false)
    navigate('/')
  }

  return (
    <header
      className={`z-40 h-16 border-b border-neutral-200 bg-bg-page ${
        isProtectedPage ? 'sticky top-0' : 'relative'
      }`}
    >
      {/* Navbar desktop */}
      <nav className="hidden h-full w-full xl:flex">
        <div className="flex h-full w-full items-center px-[var(--scale-1100)]">
          <Brand />

          {/* Menu */}
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-7 font-link">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                  pathname === link.to
                    ? 'after:scale-x-100'
                    : 'after:scale-x-0 hover:after:scale-x-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Opciones */}
          <div className="ml-auto flex items-center gap-7">
            <LanguageSwitcher />

            {isAuthenticated && !isProtectedPage && (
              <Link
                to="/admin/dashboard"
                className="font-body text-body-sm font-normal text-body-text-dark transition-colors hover:text-heading"
              >
                {t('navbar.dashboard')}
              </Link>
            )}

            {isAuthenticated && !isProtectedPage && <ProfileButton />}

            {!isAuthenticated && (
              <Link
                to="/login"
                aria-label={t('navbar.adminLogin')}
                title={t('navbar.adminLogin')}
                className="inline-flex size-10 items-center justify-center text-green-500 transition-opacity hover:opacity-70"
              >
                <LockIcon size={18} aria-hidden="true" />
              </Link>
            )}

            {isAuthenticated && isProtectedPage && <ProfileButton />}
          </div>
        </div>
      </nav>

      {/* Navbar mobile */}
      <nav className="flex h-full w-full xl:hidden">
        <div
          className={`flex h-full w-full items-center justify-between ${
            isProtectedPage
              ? 'px-md pr-lg'
              : 'mx-auto max-w-[var(--container-max-width)] px-lg'
          }`}
        >
          <Brand />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-heading"
              aria-label="Open menu"
            >
              <MenuIcon size={28} />
            </button>
          </div>
        </div>
      </nav>

      {/* Fondo */}
      {drawerOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          className="fixed inset-0 z-50 cursor-default bg-scrim"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[60] h-dvh w-[280px] overflow-y-auto bg-bg-page transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <Brand />

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="text-heading"
            aria-label="Close menu"
          >
            <XIcon size={28} />
          </button>
        </div>

        {/* Menu publico */}
        {!isProtectedPage && (
          <nav className="flex flex-col items-center gap-6 px-6 pt-6 font-link">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
                className={`relative w-fit font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                  pathname === link.to
                    ? 'after:scale-x-100'
                    : 'after:scale-x-0 hover:after:scale-x-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Usuario */}
            {isAuthenticated && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="font-body text-body-sm font-normal text-body-text-dark transition-colors hover:text-heading"
                >
                  {t('navbar.dashboard')}
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="font-body text-body-sm font-normal text-body-text-dark transition-colors hover:text-heading"
                >
                  {t('profile.viewProfile')}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-body text-body-sm font-normal text-danger transition-colors hover:opacity-70"
                >
                  {t('profile.logout')}
                </button>
              </>
            )}

            {/* Login */}
            {!isAuthenticated && (
              <Link
                to="/login"
                aria-label={t('navbar.adminLogin')}
                title={t('navbar.adminLogin')}
                onClick={() => setDrawerOpen(false)}
                className="inline-flex size-10 items-center justify-center text-green-500 transition-opacity hover:opacity-70"
              >
                <LockIcon size={18} aria-hidden="true" />
              </Link>
            )}
          </nav>
        )}

            {/* Menu protegido */}
        {isAuthenticated && isProtectedPage && (
          <nav className="flex flex-col items-center gap-6 px-6 pt-6 font-link">
            <Link
              to="/"
              onClick={() => setDrawerOpen(false)}
              className={`relative w-fit font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                pathname === '/'
                  ? 'after:scale-x-100'
                  : 'after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {t('navbar.home')}
            </Link>

            <Link
              to="/admin/dashboard"
              onClick={() => setDrawerOpen(false)}
              className={`relative w-fit font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                pathname === '/admin/dashboard'
                  ? 'after:scale-x-100'
                  : 'after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {t('navbar.dashboard')}
            </Link>

            <Link
              to="/profile"
              onClick={() => setDrawerOpen(false)}
              className={`relative w-fit font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                pathname === '/profile'
                  ? 'after:scale-x-100'
                  : 'after:scale-x-0 hover:after:scale-x-100'
              }`}
            >
              {t('profile.viewProfile')}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="relative w-fit font-body text-body-sm font-normal text-danger transition-opacity hover:opacity-70"
            >
              {t('profile.logout')}
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Navbar
