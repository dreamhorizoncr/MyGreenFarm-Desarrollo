import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PlusIcon, SearchIcon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import EditUserModal from '../components/EditUserModal.tsx'
import DeleteUserModal from '../components/DeleteUserModal.tsx'
import TeacherCard from '../components/TeacherCard.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useAdmin } from '../hooks/useAdmin.ts'
import { notify } from '../utils/notifications.ts'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

const PAGE_SIZE = 10

function AdminUsersPage() {
  const { t } = useTranslation()
  const { users, loading, error, fetchUsers, updateUser, deleteUser } = useAdmin()

  const currentUser = userStorage.getUser()
  const [userToEdit, setUserToEdit] = useState<UserInfo | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    void fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const roleOptions = useMemo(() => ['ALL', ...Array.from(new Set(['OWNER', ...users.map((user) => user.role)]))], [users])

  const roleLabels: Record<string, string> = {
    OWNER: t('admin.roles.OWNER'),
    TEACHER: t('admin.roles.TEACHER'),
    ADMIN: t('admin.roles.ADMIN'),
  }

  const roleFilterClassName = (active: boolean) =>
    `rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
      active ? 'border-green-500 bg-green-500 text-white' : 'border-green-500 bg-white text-heading hover:bg-green-50'
    }`

  const handleSave = async (id: string, data: UpdateUserData) => {
    try {
      await updateUser(id, data)
      notify.success(t('admin.updateDocenteToastTitle'))
    } catch (err) {
      notify.error(t('admin.updateDocenteErrorToastTitle'))
      throw err
    }
  }

  const handleEdit = (user: UserInfo) => () => {
    setUserToEdit(user)
  }

  const handleDelete = (user: UserInfo) => () => {
    setUserToDelete(user)
  }

  return (
    <div id="admin-users">
      <AdminLayout>
        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
          {t('admin.docentesTitle')}
        </h1>
        <p className="mt-2 font-body text-body text-neutral-500">
          {t('admin.docentesSubtitle')}
        </p>

        <div className="mb-[var(--spacing-lg)] mt-[var(--spacing-xl)] flex flex-wrap items-center justify-between gap-md">
          <div className="flex h-11 min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
            <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
            <input
              type="search"
              className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
              placeholder={t('admin.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('admin.searchPlaceholder')}
            />
          </div>

          <Link
            to="/signup"
            className="inline-flex h-11 items-center gap-xs whitespace-nowrap rounded-full bg-orange-500 px-[var(--scale-600)] font-body text-body-sm font-semibold text-white no-underline transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <PlusIcon size={18} aria-hidden="true" />
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
              {role === 'ALL' ? t('admin.allRoles') : roleLabels[role] ?? role}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            <TeacherCard loading />
            <TeacherCard loading />
            <TeacherCard loading />
            <TeacherCard loading />
          </div>
        )}

        {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

        {!loading && !error && (
          filteredUsers.length === 0 ? (
            <p className="m-0 p-xl text-center font-body text-body text-neutral-500">
              {searchTerm.trim() || roleFilter !== 'ALL' ? t('admin.noResults') : t('common.noUsers')}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
                {pagedUsers.map((user) => (
                  <TeacherCard
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUser?.id}
                    onEdit={handleEdit(user)}
                    onDelete={handleDelete(user)}
                  />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
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
            try {
              await deleteUser(id)
              notify.success(t('admin.deleteDocenteToastTitle'))
            } catch (err) {
              notify.error(t('admin.deleteDocenteErrorToastTitle'))
              throw err
            }
          }}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  )
}

export default AdminUsersPage