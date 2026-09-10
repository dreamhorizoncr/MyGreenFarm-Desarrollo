import { useTranslation } from 'react-i18next'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { UserInfo } from '../types/auth.ts'

interface TeacherCardProps {
  user: UserInfo
  isMenuOpen: boolean
  isSelf: boolean
  menuRef?: (el: HTMLDivElement | null) => void
  onToggleMenu: () => void
  onEdit: () => void
  onDelete: () => void
}

function TeacherCard({ user, isMenuOpen, isSelf, menuRef, onToggleMenu, onEdit, onDelete }: TeacherCardProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg">
      <header className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <h3 className="m-0 font-heading text-lg font-bold leading-snug text-heading">
            {user.firstName} {user.lastName}
          </h3>
          <p className="m-0 mt-2xs font-body text-body-sm text-neutral-500">
            {user.role}
          </p>
        </div>

        <div className="relative inline-flex shrink-0" ref={menuRef}>
          <button
            type="button"
            className="inline-flex size-[34px] items-center justify-center rounded-full bg-transparent text-link focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
            onClick={onToggleMenu}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label={t('admin.actions')}
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-[calc(100%+var(--spacing-2xs))] z-30 min-w-[180px] rounded-xl border border-neutral-200 bg-white p-2xs shadow animate-[admin-row-menu-in_0.12s_ease-out]"
              role="menu"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-sm text-body-text focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-[-2px]"
                role="menuitem"
                onClick={onEdit}
              >
                <Pencil size={14} />
                <span>{t('admin.edit')}</span>
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-sm text-danger focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50"
                role="menuitem"
                onClick={onDelete}
                disabled={isSelf}
                title={isSelf ? t('admin.selfDeleteNotAllowed') : undefined}
              >
                <Trash2 size={14} />
                <span>{t('admin.delete')}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <p className="m-0 mt-md break-words font-body text-[15px] text-body-text">
        {user.email}
      </p>
    </article>
  )
}

export default TeacherCard