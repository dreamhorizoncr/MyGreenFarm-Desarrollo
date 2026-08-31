import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import EditUserModal from '../components/EditUserModal.tsx'
import DeleteUserModal from '../components/DeleteUserModal.tsx'
import { useAdmin } from '../hooks/useAdmin.ts'
import useDismiss from '../hooks/useDismiss.ts'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

function AdminUsersPage() {
  const { t } = useTranslation()
  const { users, loading, error, fetchUsers, updateUser, deleteUser } = useAdmin()

  const currentUser = userStorage.getUser()
  const [userToEdit, setUserToEdit] = useState<UserInfo | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDismiss({
    ref: menuRef,
    isOpen: openMenuId !== null,
    onClose: () => setOpenMenuId(null),
  })

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.role].some((field) =>
        field.toLowerCase().includes(term),
      ),
    )
  }, [users, searchTerm])

  const handleSave = async (id: string, data: UpdateUserData) => {
    await updateUser(id, data)
  }

  return (
    <div id="admin-users">
      <AdminLayout>
        <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
          {t('admin.docentesTitle')}
        </h1>
        <p className="mt-2 font-body text-base text-neutral-500">
          {t('admin.docentesSubtitle')}
        </p>

        <div className="mb-[var(--spacing-lg)] mt-[var(--spacing-xl)] flex flex-wrap items-center justify-between gap-md">
          <div className="flex h-[44px] min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full bg-white px-md">
            <Search size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
            <input
              type="search"
              className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-[15px] text-body-text outline-none placeholder:text-neutral-400"
              placeholder={t('admin.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('admin.searchPlaceholder')}
            />
          </div>

          <Link
            to="/signup"
            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full bg-green-500 px-[var(--scale-600)] font-body text-[15px] font-semibold text-white no-underline focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <Plus size={18} aria-hidden="true" />
            <span>{t('admin.addDocente')}</span>
          </Link>
        </div>

        {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}

        {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

        {!loading && !error && (
          filteredUsers.length === 0 ? (
            <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
              {searchTerm.trim() ? t('admin.noResults') : t('common.noUsers')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate font-body [border-spacing:0_var(--spacing-xs)]">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap px-md py-2xs text-left text-sm font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('admin.firstName')}
                    </th>
                    <th className="whitespace-nowrap px-md py-2xs text-left text-sm font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('admin.lastName')}
                    </th>
                    <th className="whitespace-nowrap px-md py-2xs text-left text-sm font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('admin.email')}
                    </th>
                    <th className="whitespace-nowrap px-md py-2xs text-left text-sm font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('admin.role')}
                    </th>
                    <th className="whitespace-nowrap px-md py-2xs text-center text-sm font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="rounded-l-xl bg-white p-md align-middle text-left text-[15px] text-body-text">
                        {user.firstName}
                      </td>
                      <td className="bg-white p-md align-middle text-left text-[15px] text-body-text">
                        {user.lastName}
                      </td>
                      <td className="bg-white p-md align-middle text-left text-[15px] text-body-text">
                        {user.email}
                      </td>
                      <td className="bg-white p-md align-middle text-left text-[15px] text-body-text">
                        {user.role}
                      </td>
                      <td className="rounded-r-xl bg-white p-md text-center align-middle text-[15px] text-body-text">
                        <div className="inline-flex items-center justify-center gap-2xs">
                          <div
                            className="relative inline-flex"
                            ref={(element) => {
                              if (openMenuId === user.id) {
                                menuRef.current = element
                              }
                            }}
                          >
                            <button
                              type="button"
                              className="inline-flex size-[34px] items-center justify-center rounded-full bg-transparent text-link focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                              onClick={() =>
                                setOpenMenuId((prev) => (prev === user.id ? null : user.id))
                              }
                              aria-expanded={openMenuId === user.id}
                              aria-haspopup="menu"
                              aria-label={t('admin.actions')}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMenuId === user.id && (
                              <div
                                className="absolute right-0 top-[calc(100%+var(--spacing-2xs))] z-30 min-w-[180px] rounded-xl border border-neutral-200 bg-white p-2xs shadow animate-[admin-row-menu-in_0.12s_ease-out]"
                                role="menu"
                              >
                                <button
                                  type="button"
                                  className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-sm text-body-text focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-[-2px]"
                                  role="menuitem"
                                  onClick={() => {
                                    setUserToEdit(user)
                                    setOpenMenuId(null)
                                  }}
                                >
                                  <Pencil size={14} />
                                  <span>{t('admin.edit')}</span>
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-sm text-danger focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50"
                                  role="menuitem"
                                  onClick={() => {
                                    setUserToDelete(user)
                                    setOpenMenuId(null)
                                  }}
                                  disabled={user.id === currentUser?.id}
                                  title={
                                    user.id === currentUser?.id
                                      ? t('admin.selfDeleteNotAllowed')
                                      : undefined
                                  }
                                >
                                  <Trash2 size={14} />
                                  <span>{t('admin.delete')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </AdminLayout>

      {userToEdit && currentUser && (
        <EditUserModal
          userToEdit={userToEdit}
          currentUser={currentUser}
          onSave={handleSave}
          onClose={() => setUserToEdit(null)}
        />
      )}

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onConfirm={async (id) => {
            await deleteUser(id)
          }}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  )
}

export default AdminUsersPage