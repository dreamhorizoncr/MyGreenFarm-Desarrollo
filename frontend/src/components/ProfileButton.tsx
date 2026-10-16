import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'
import { Link, useNavigate } from 'react-router-dom';
import { userStorage } from '../utils/userStorage.ts'
import { useCallback, useRef, useState } from 'react';
import { UserIcon, LogOutIcon } from '@animateicons/react/lucide';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.ts';
import { tokenStorage } from '../utils/token.ts'
import { claimExclusiveOpen, releaseExclusiveOpen } from '../utils/exclusiveMenu.ts'
import useDismiss from '../hooks/useDismiss.ts'

function ProfileButton() {

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const rootRef = useRef<HTMLDivElement>(null)
  const dismissMenu = useCallback(() => {
    releaseExclusiveOpen(closeMenu)
    closeMenu()
  }, [closeMenu])
  useDismiss({ ref: rootRef, isOpen: menuOpen, onClose: dismissMenu })

  const user = userStorage.getUser()
  if (!user) return null

  const handleLogout = async () => {
    await authService.signout()

    tokenStorage.clear()
    userStorage.clear()

    navigate('/')
  }

  return (

  <div ref={rootRef} className="relative inline-flex size-10 shrink-0 items-center justify-center">
    <button
      type="button"
      onClick={() => {
        const next = !menuOpen
        setMenuOpen(next)
        if (next) claimExclusiveOpen(closeMenu)
        else releaseExclusiveOpen(closeMenu)
      }}
      aria-label={`${user.firstName} ${user.lastName}`}
      className="inline-flex size-10 items-center justify-center rounded-full bg-transparent transition-shadow duration-150 hover:shadow-[0_0_0_4px_var(--heading-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
    >
      <Blobatar
        name={user.email}
        size={38}
        animate="always"
        title={`${user.firstName} ${user.lastName}`}
        className="shrink-0 rounded-full"
      />
    </button>
      {menuOpen && (
        <div className="absolute right-0 top-[calc(100%+var(--spacing-xs))] z-50 min-w-[190px] rounded-xl border border-neutral-200 bg-white p-xs shadow-lg animate-[language-switcher-in_0.15s_ease-out]">
          <Link
            to="/profile"
            onClick={() => { releaseExclusiveOpen(closeMenu); closeMenu() }}
            className="flex w-full items-center gap-2 rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100"
          >
          <UserIcon size={18} className="shrink-0" />
            {t('profile.viewProfile')}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-md py-sm text-left font-body text-body-sm text-danger transition-colors duration-150 hover:bg-danger-100"
          >
            <LogOutIcon size={18} className="shrink-0" />
              {t('profile.logout')}
          </button>
  </div>
      )}
  </div>
  )
}

export default ProfileButton
