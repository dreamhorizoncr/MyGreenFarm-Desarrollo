import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher.tsx'
import ProfileButton from './ProfileButton.tsx'
import { userStorage } from '../utils/userStorage.ts'

function Brand() {
  const isAdminSection = useLocation().pathname.startsWith('/admin')

  return (
    <Link
      to={isAdminSection ? '/admin/dashboard' : '/'}
      className="flex items-center gap-3 no-underline"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-green-500" aria-hidden="true" />
      <span className="font-heading text-h6 text-heading">My Green Farm</span>
    </Link>
  )
}

function Navbar() {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isAuthenticated = Boolean(userStorage.getUser())

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
      <nav className="hidden h-full w-full items-center pl-4 pr-11 md:flex">
        <Brand />

        <div className="ml-auto flex items-center gap-7 font-link">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-body transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}

          <LanguageSwitcher />

          {isAuthenticated && <ProfileButton />}
        </div>
      </nav>

      {/* Mobile nav */}
      <nav className="flex h-full w-full items-center justify-between px-6 md:hidden">
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

        <nav className="flex flex-col gap-6 px-6 pt-6 font-link">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-body transition-opacity hover:opacity-70"
              onClick={() => setDrawerOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {isAuthenticated && (
          <div className="px-6 pt-8">
            <ProfileButton />
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar