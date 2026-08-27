import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher.tsx'

interface NavbarProps {
  variant?: 'full' | 'minimal'
}

function Navbar({ variant = 'full' }: NavbarProps) {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navLinks = variant === 'full'
    ? [
        { to: '/', label: t('navbar.home') },
        { to: '/news', label: t('navbar.news') },
        { to: '/multimedia', label: t('navbar.multimedia') },
        { to: '/forum', label: t('navbar.forum') },
        { to: '/services', label: t('navbar.services') },
      ]
    : [
        { to: '/', label: t('navbar.home') },
      ]

  return (
    <header className="relative z-40 h-16 bg-cream-100">
      {/* Desktop nav */}
      <nav className="mx-auto hidden h-full w-full max-w-[1200px] items-center px-11 md:flex">
        <Link to="/" className="font-heading text-h6 text-heading">
          My Green Farm
        </Link>

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

          <Link
            to="/login"
            className="rounded-full bg-success px-8 py-2 text-white transition-opacity hover:opacity-90"
          >
            {t('navbar.signIn')}
          </Link>

          <Link
            to="/signup"
            className="rounded-full border border-heading px-8 py-2 text-body transition-colors hover:bg-cream-200"
          >
            {t('navbar.signUp')}
          </Link>

          <LanguageSwitcher />
        </div>
      </nav>

      {/* Mobile nav */}
      <nav className="flex h-full w-full items-center justify-between px-6 md:hidden">
        <Link to="/" className="font-heading text-h6 text-heading">
          My Green Farm
        </Link>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-heading"
          aria-label="Open menu"
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="navbar-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`navbar-drawer ${drawerOpen ? 'navbar-drawer--open' : ''}`}>
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="font-heading text-h6 text-heading"
            onClick={() => setDrawerOpen(false)}
          >
            My Green Farm
          </Link>

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

        <div className="flex flex-col gap-4 px-6 pt-8">
          <Link
            to="/login"
            className="rounded-full bg-success px-8 py-2 text-center text-white transition-opacity hover:opacity-90"
            onClick={() => setDrawerOpen(false)}
          >
            {t('navbar.signIn')}
          </Link>

          <Link
            to="/signup"
            className="rounded-full border border-heading px-8 py-2 text-center text-body transition-colors hover:bg-cream-200"
            onClick={() => setDrawerOpen(false)}
          >
            {t('navbar.signUp')}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
