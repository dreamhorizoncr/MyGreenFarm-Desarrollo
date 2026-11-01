import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LockIcon, MenuIcon, XIcon } from '@animateicons/react/lucide'
import LanguageSwitcher from './LanguageSwitcher.tsx'
import ProfileButton from './ProfileButton.tsx'
import { userStorage } from '../utils/userStorage.ts'
import logo from '../assets/imgs/Logo.svg'
import { authService } from '../services/auth.ts'
import { tokenStorage } from '../utils/token.ts'

interface BrandProps {
  showName?: boolean
  linkRef?: RefObject<HTMLAnchorElement | null>
  nameRef?: RefObject<HTMLSpanElement | null>
}

function Brand({ showName = true, linkRef, nameRef }: Readonly<BrandProps>) {
  return (
    <Link
      ref={linkRef}
      to='/'
      className="flex shrink-0 items-center gap-3 no-underline"
    >
      <img src={logo} alt="My Green Farm" className="h-12 w-auto max-w-[48px] object-contain" />
      {showName && <span ref={nameRef} className="whitespace-nowrap font-heading text-h6 text-heading">My Green Farm</span>}
    </Link>
  )
}

const BRAND_GAP = 12

function useBrandNameFits(language: string, isAuthenticated: boolean) {
  const rowRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLAnchorElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const nameWidthRef = useRef(0)
  const [showName, setShowName] = useState(true)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const measure = () => {
      const brand = brandRef.current
      const menu = menuRef.current
      const options = optionsRef.current
      if (!brand || !menu || !options || row.clientWidth === 0) return

      if (nameRef.current) nameWidthRef.current = nameRef.current.offsetWidth
      const nameWidth = nameRef.current ? 0 : nameWidthRef.current + BRAND_GAP

      const rowStyle = getComputedStyle(row)
      const menuStyle = getComputedStyle(menu)
      const links = Array.from(menu.children) as HTMLElement[]
      const menuWidth =
        links.reduce((total, link) => total + link.offsetWidth, 0) +
        Number.parseFloat(menuStyle.columnGap || '0') * Math.max(0, links.length - 1) +
        Number.parseFloat(menuStyle.paddingLeft) +
        Number.parseFloat(menuStyle.paddingRight)
      const available = row.clientWidth - Number.parseFloat(rowStyle.paddingLeft) - Number.parseFloat(rowStyle.paddingRight)

      setShowName(brand.offsetWidth + nameWidth + menuWidth + options.offsetWidth <= available)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    void document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [language, isAuthenticated])

  return { rowRef, brandRef, nameRef, menuRef, optionsRef, showName }
}

function Navbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isAuthenticated = Boolean(userStorage.getUser())
  const { rowRef, brandRef, nameRef, menuRef, optionsRef, showName } = useBrandNameFits(i18n.language, isAuthenticated)
  const isProtectedPage =
    pathname === '/profile' ||
    pathname.startsWith('/admin')

  const navLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/news', label: t('navbar.news') },
    { to: '/multimedia', label: t('navbar.multimedia') },
    { to: '/forum', label: t('navbar.forum') },
    { to: '/clubs', label: t('navbar.clubs') },
    { to: '/vacantes', label: t('navbar.vacancies') },
    { to: '/about-us', label: t('navbar.aboutUs') },
    { to: '/green-hearts', label: t('greenHearts.navLabel') },
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
      <nav className="hidden h-full w-full xl:flex">
        <div ref={rowRef} className="flex h-full w-full items-center justify-between px-[var(--scale-1100)]">
          <Brand showName={showName} linkRef={brandRef} nameRef={nameRef} />

          <div ref={menuRef} className="flex items-center justify-center gap-6 px-6 font-link 2xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative whitespace-nowrap font-normal text-body-text-dark transition-colors hover:text-heading after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-center after:bg-green-500 after:transition-transform after:duration-300 after:content-[''] ${
                  pathname === link.to
                    ? 'after:scale-x-100'
                    : 'after:scale-x-0 hover:after:scale-x-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div ref={optionsRef} className="flex shrink-0 items-center gap-5 2xl:gap-7">
            <LanguageSwitcher />

            {isAuthenticated && <ProfileButton />}

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
          </div>
        </div>
      </nav>

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

      {drawerOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          aria-label="Close menu"
          className="fixed inset-0 z-50 cursor-default bg-scrim"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
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
            <XIcon size={28} />
          </button>
        </div>

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

            {isAuthenticated && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="font-body text-body-sm font-normal text-body-text-dark transition-colors hover:text-heading"
                >
                  {t('navbar.dashboard')}
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
