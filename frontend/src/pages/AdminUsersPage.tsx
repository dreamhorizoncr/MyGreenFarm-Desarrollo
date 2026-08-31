import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import EditUserModal from '../components/EditUserModal.tsx'
import { useAdmin } from '../hooks/useAdmin.ts'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

function AdminUsersPage() {
  const { t } = useTranslation()
  const { users, loading, error, fetchUsers, updateUser } = useAdmin()

  const currentUser = userStorage.getUser()
  const [userToEdit, setUserToEdit] = useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuId])

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
        <h1 className="admin-page-title">{t('admin.docentesTitle')}</h1>
        <p className="admin-page-subtitle">{t('admin.docentesSubtitle')}</p>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} className="admin-search__icon" aria-hidden="true" />
              <input
                type="search"
                className="admin-search__input"
                placeholder={t('admin.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('admin.searchPlaceholder')}
              />
            </div>

            <Link to="/signup" className="admin-add-btn">
              <Plus size={18} aria-hidden="true" />
              <span>{t('admin.addDocente')}</span>
            </Link>
          </div>

          {loading && (
            <p className="admin-empty">{t('common.loading')}</p>
          )}

          {error && (
            <p className="admin-error">{error}</p>
          )}

          {!loading && !error && (
            filteredUsers.length === 0 ? (
              <p className="admin-empty">
                {searchTerm.trim() ? t('admin.noResults') : t('common.noUsers')}
              </p>
            ) : (
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('admin.firstName')}</th>
                      <th>{t('admin.lastName')}</th>
                      <th>{t('admin.email')}</th>
                      <th>{t('admin.role')}</th>
                      <th>{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="admin-table__row">
                        <td>{user.firstName}</td>
                        <td>{user.lastName}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <div className="admin-actions">
                            <div
                              className="admin-row-menu"
                              ref={(element) => {
                                if (openMenuId === user.id) {
                                  menuRef.current = element
                                }
                              }}
                            >
                              <button
                                type="button"
                                className="admin-actions__button"
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
                                <div className="admin-row-menu__dropdown" role="menu">
                                  <button
                                    type="button"
                                    className="admin-row-menu__option"
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
                                    className="admin-row-menu__option admin-row-menu__option--danger"
                                    role="menuitem"
                                    disabled
                                    title={t('admin.notAvailable')}
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
      </div>
    )
  }

export default AdminUsersPage