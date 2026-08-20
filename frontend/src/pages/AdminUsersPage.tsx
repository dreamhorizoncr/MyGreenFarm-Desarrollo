import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import ProfileButton from '../components/ProfileButton.tsx'
import EditUserModal from '../components/EditUserModal.tsx'
import { useAdmin } from '../hooks/useAdmin.ts'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

function AdminUsersPage() {
  const { t } = useTranslation()
  const { users, loading, error, fetchUsers, updateUser } = useAdmin()

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [userToEdit, setUserToEdit] = useState<UserInfo | null>(null)

  useEffect(() => {
    const stored = userStorage.getUser()
    if (stored) setCurrentUser(stored)
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (id: string, data: UpdateUserData) => {
    await updateUser(id, data)
  }

  return (
    <section id="admin-users">
      <div className="home-header">
        <LanguageSwitcher />
        <ProfileButton />
      </div>

      <h1>{t('admin.title')}</h1>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.firstName')}</th>
              <th>{t('admin.lastName')}</th>
              <th>{t('admin.email')}</th>
              <th>{t('admin.role')}</th>
              <th>{t('admin.edit')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    type="button"
                    className="admin-table__edit"
                    onClick={() => setUserToEdit(user)}
                    aria-label={t('admin.edit')}
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {userToEdit && currentUser && (
        <EditUserModal
          userToEdit={userToEdit}
          currentUser={currentUser}
          onSave={handleSave}
          onClose={() => setUserToEdit(null)}
        />
      )}
    </section>
  )
}

export default AdminUsersPage
