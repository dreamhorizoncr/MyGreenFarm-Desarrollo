import { Blobatar } from '@blobatar/react'
import { useGaze } from '@blobatar/react/gaze'
import { scared, unsure } from 'blobatar/expression'
import 'blobatar/gaze.css'
import 'blobatar/motion.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin.ts'
import { useProfileAvatar } from '../contexts/ProfileAvatarContext.tsx'
import AdminLayout from '../layout/AdminLayout.tsx'
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx'
import { notify } from '../utils/notifications.ts'
import { userStorage } from '../utils/userStorage.ts'

function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useLogin()
  const user = userStorage.getUser()
  const { ref: blobatarRef } = useGaze({ lookAt: 'pointer', travel: 3 })
  const { sidebarHovered } = useProfileAvatar()
  const [logoutHovered, setLogoutHovered] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const idleExpression = sidebarHovered ? unsure : undefined
  const expression = logoutHovered ? scared : idleExpression

  const roleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return t('profile.roles.admin')
      case 'MODERATOR':
        return t('profile.roles.moderator')
      default:
        return t('profile.roles.user')
    }
  }

  const handleLogout = async () => {
    await logout()
    notify.success(t('profile.logoutToastTitle'))
    navigate('/')
  }

  const fieldClass =
    'h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-md font-body text-body-sm text-body-text'

  return (
    <>
    <AdminLayout>
      <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
        {t('profile.title')}
      </h1>
      <p className="mt-2 font-body text-body text-neutral-500">
        {t('profile.description')}
      </p>

      <div className="mt-8 w-full">
          {user && (
            <Blobatar
              name={user.email}
              size={140}
              animate="always"
              expression={expression}
              ref={blobatarRef}
              title={`${user.firstName} ${user.lastName}`}
              className="rounded-full"
            />
          )}

          <div className="mt-8 grid grid-cols-1 gap-y-5 md:grid-cols-2 md:gap-x-8">
            <div>
              <label
                htmlFor="profile-firstname"
                className="mb-xs block font-body text-body-sm font-medium text-body-text"
              >
                {t('profile.firstName')}
              </label>
              <input id="profile-firstname" value={user?.firstName ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-lastname"
                className="mb-xs block font-body text-body-sm font-medium text-body-text"
              >
                {t('profile.lastName')}
              </label>
              <input id="profile-lastname" value={user?.lastName ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-xs block font-body text-body-sm font-medium text-body-text"
              >
                {t('profile.email')}
              </label>
              <input id="profile-email" value={user?.email ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-role"
                className="mb-xs block font-body text-body-sm font-medium text-body-text"
              >
                {t('profile.role')}
              </label>
              <input id="profile-role" value={user ? roleLabel(user.role) : ''} readOnly className={fieldClass} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowResetPasswordModal(true)}
            className="flex h-11 w-full items-center justify-center rounded-full border border-green-500 px-5 font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 sm:w-auto"
          >
            {t('profile.resetPassword')}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            onFocus={() => setLogoutHovered(true)}
            onBlur={() => setLogoutHovered(false)}
            className="h-11 w-full rounded-full bg-danger px-5 font-body text-body-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 sm:w-auto"
          >
            {t('profile.logout')}
          </button>
        </div>
    </AdminLayout>

    {showResetPasswordModal && (
      <ForgotPasswordModal
        email={user?.email ?? ''}
        onClose={() => setShowResetPasswordModal(false)}
      />
    )}
    </>
  )
}

export default ProfilePage
