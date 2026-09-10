import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin.ts'
import AdminLayout from '../layout/AdminLayout.tsx'
import { userStorage } from '../utils/userStorage.ts'

function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useLogin()
  const user = userStorage.getUser()

  const initials = user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : ''

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
    navigate('/')
  }

  const fieldClass =
    'h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-md font-body text-[15px] text-body-text'

  return (
    <AdminLayout>
      <h1 className="m-0 font-heading text-[30px] font-bold leading-[1.15] text-heading">
        {t('profile.title')}
      </h1>
      <p className="mt-2 font-body text-base text-neutral-500">
        {t('profile.description')}
      </p>

      <div className="mt-8 w-full">
          <span
            className="inline-flex size-16 select-none items-center justify-center rounded-full bg-green-500 font-heading text-lg leading-none text-white"
            aria-hidden="true"
          >
            {initials}
          </span>

          <div className="mt-8 grid grid-cols-1 gap-y-5 md:grid-cols-2 md:gap-x-8">
            <div>
              <label
                htmlFor="profile-firstname"
                className="mb-xs block font-body text-sm font-medium text-body-text"
              >
                {t('profile.firstName')}
              </label>
              <input id="profile-firstname" value={user?.firstName ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-lastname"
                className="mb-xs block font-body text-sm font-medium text-body-text"
              >
                {t('profile.lastName')}
              </label>
              <input id="profile-lastname" value={user?.lastName ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-xs block font-body text-sm font-medium text-body-text"
              >
                {t('profile.email')}
              </label>
              <input id="profile-email" value={user?.email ?? ''} readOnly className={fieldClass} />
            </div>

            <div>
              <label
                htmlFor="profile-role"
                className="mb-xs block font-body text-sm font-medium text-body-text"
              >
                {t('profile.role')}
              </label>
              <input id="profile-role" value={user ? roleLabel(user.role) : ''} readOnly className={fieldClass} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center md:justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="h-11 w-full rounded-full bg-danger font-body text-[15px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 md:w-[120px]"
          >
            {t('profile.logout')}
          </button>
        </div>
    </AdminLayout>
  )
}

export default ProfilePage