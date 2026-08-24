import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users } from 'lucide-react'
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

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (!user) return null

  const initials = (user.firstName[0] + user.lastName[0]).toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="profile-button" ref={rootRef}>
      <button
        type="button"
        className="profile-button__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${user.firstName} ${user.lastName}`}
      >
        <span className="profile-button__avatar" aria-hidden="true">
          {initials}
        </span>
      </button>

      {open && (
        <div className="profile-button__dropdown" role="menu">
          <p className="profile-button__user-info">
            {user.firstName} {user.lastName}
          </p>

          {user.role === 'ADMIN' && (
            <button
              type="button"
              className="profile-button__option"
              role="menuitem"
              onClick={() => {
                navigate('/admin/users')
                setOpen(false)
              }}
            >
              <Users size={16} />
              <span>{t('profile.admin')}</span>
            </button>
          )}

          <button
            type="button"
            className="profile-button__option profile-button__option--danger"
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
