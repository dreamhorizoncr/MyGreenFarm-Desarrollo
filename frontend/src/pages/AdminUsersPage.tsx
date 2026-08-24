import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
    <section id="admin-users" className="min-h-screen bg-cream-100">
      {/* Encabezado */}
      <div className="home-header">
        <Link to="/" className="font-heading text-[26px] text-heading no-underline">
          My Green Farm
        </Link>

        <div className="flex items-center gap-7">
          <LanguageSwitcher />
          <ProfileButton />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-11 pb-16 pt-10">
        <h1 className="m-0 mb-9 text-center font-heading text-h2 font-normal leading-none text-heading">
          {t('admin.title')}
        </h1>

        {loading && (
          <p className="m-0 text-center font-body text-body">{t('common.loading')}</p>
        )}

        {error && (
          <p className="m-0 text-center font-link text-sm text-danger">{error}</p>
        )}

        {!loading && !error && (
          users.length === 0 ? (
            <p className="admin-table-empty">{t('common.noUsers')}</p>
          ) : (
            <div className="admin-table-card">
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
                          <Pencil size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

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
