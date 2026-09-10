import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import AdminLayout from '../layout/AdminLayout.tsx'
import EditUserModal from '../components/EditUserModal.tsx'
import DeleteUserModal from '../components/DeleteUserModal.tsx'
import TeacherCard from '../components/TeacherCard.tsx'
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
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
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
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false
      if (!term) return true
      return [user.firstName, user.lastName, user.email, user.role].some((field) =>
        field.toLowerCase().includes(term),
      )
    })
  }, [users, searchTerm, roleFilter])

  const roleOptions = useMemo(() => ['ALL', ...Array.from(new Set(users.map((user) => user.role)))], [users])

  const roleFilterClassName = (active: boolean) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      active ? 'bg-green-500 text-white' : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  const handleSave = async (id: string, data: UpdateUserData) => {
    await updateUser(id, data)
  }

  const handleToggleMenu = (id: string) => () =>
    setOpenMenuId((prev) => (prev === id ? null : id))

  const handleEdit = (user: UserInfo) => () => {
    setUserToEdit(user)
    setOpenMenuId(null)
  }

  const handleDelete = (user: UserInfo) => () => {
    setUserToDelete(user)
    setOpenMenuId(null)
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
          <div className="flex h-[44px] min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
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
            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full bg-orange-500 px-[var(--scale-600)] font-body text-[15px] font-semibold text-white no-underline focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <Plus size={18} aria-hidden="true" />
            <span>{t('admin.addDocente')}</span>
          </Link>
        </div>

        <div className="-mt-sm mb-lg flex flex-wrap gap-sm">
          {roleOptions.map((role) => (
            <button
              key={role}
              type="button"
              aria-pressed={roleFilter === role}
              onClick={() => setRoleFilter(role)}
              className={roleFilterClassName(roleFilter === role)}
            >
              {role === 'ALL' ? t('admin.allRoles') : role}
            </button>
          ))}
        </div>

        {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}

        {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

        {!loading && !error && (
          filteredUsers.length === 0 ? (
            <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
              {searchTerm.trim() || roleFilter !== 'ALL' ? t('admin.noResults') : t('common.noUsers')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
              {filteredUsers.map((user) => (
                <TeacherCard
                  key={user.id}
                  user={user}
                  isMenuOpen={openMenuId === user.id}
                  isSelf={user.id === currentUser?.id}
                  menuRef={(element) => {
                    if (openMenuId === user.id) {
                      menuRef.current = element
                    }
                  }}
                  onToggleMenu={handleToggleMenu(user.id)}
                  onEdit={handleEdit(user)}
                  onDelete={handleDelete(user)}
                />
              ))}
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