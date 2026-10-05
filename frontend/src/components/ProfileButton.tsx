import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'
import { Link, useNavigate } from 'react-router-dom';
import { userStorage } from '../utils/userStorage.ts'
import { useState } from 'react';
import { UserIcon, LogOutIcon } from '@animateicons/react/lucide';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.ts';
import { tokenStorage } from '../utils/token.ts'

function ProfileButton() {

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const user = userStorage.getUser()
  if (!user) return null

  const handleLogout = async () => {
    await authService.signout()

    tokenStorage.clear()
    userStorage.clear()

    navigate('/')
  }

  return (

  <div className="relative inline-flex size-10 shrink-0 items-center justify-center">
    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
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
        <div className="absolute right-0 top-[56px] z-50 w-[190px] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 font-body text-body-sm text-body-text-dark transition-colors hover:bg-neutral-100"
          >
          <UserIcon size={18} className="text-green-500" />
            {t('profile.viewProfile')}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-body text-body-sm text-danger transition-colors hover:bg-neutral-100"
          >
            <LogOutIcon size={18} />
              {t('profile.logout')}
          </button>
  </div>
      )}
  </div>
  )
}

export default ProfileButton
