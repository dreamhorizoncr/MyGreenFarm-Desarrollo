import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import useDismiss from '../hooks/useDismiss.ts'
import { useLogin } from '../hooks/useLogin.ts'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo } from '../types/auth.ts'

function ProfileButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useLogin()
  const rootRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    const stored = userStorage.getUser()
    if (stored) setUser(stored)
  }, [])

  useDismiss({ ref: rootRef, isOpen: open, onClose: () => setOpen(false) })

  if (!user) return null

  const initials = (user.firstName[0] + user.lastName[0]).toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const optionClasses =
    'flex w-full items-center gap-sm rounded-lg px-md py-sm text-left font-body text-sm text-body-text whitespace-nowrap bg-transparent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-[-2px]'

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full bg-transparent transition-shadow duration-150 hover:shadow-[0_0_0_4px_var(--heading-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${user.firstName} ${user.lastName}`}
      >
        <span
          className="inline-flex size-[38px] shrink-0 select-none items-center justify-center rounded-full bg-green-500 font-heading text-base leading-none text-white"
          aria-hidden="true"
        >
          {initials}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+var(--spacing-xs))] z-50 m-0 min-w-[230px] list-none rounded-xl border border-neutral-200 bg-white p-xs animate-[profile-button-in_0.15s_ease-out]"
          role="menu"
        >
          <p className="m-0 mb-2 whitespace-nowrap border-b border-neutral-100 px-md py-sm font-body text-sm font-semibold text-body-text">
            {user.firstName} {user.lastName}
          </p>

          <button
            type="button"
            className={`${optionClasses} hover:bg-danger-100 text-danger hover:text-danger`}
            role="menuitem"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>{t('profile.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileButton
