import { useTranslation } from 'react-i18next'
import type { UserInfo } from '../types/auth.ts'
import Skeleton from './ui/Skeleton.tsx'
import CardActionButton from './ui/CardActionButton.tsx'

interface TeacherCardProps {
  user?: UserInfo
  isSelf?: boolean
  onEdit?: () => void
  onDelete?: () => void
  loading?: boolean
}

function TeacherCard({ user, isSelf, onEdit, onDelete, loading = false }: Readonly<TeacherCardProps>) {
  const { t, i18n } = useTranslation()
  const roleLabels: Record<string, string> = {
    OWNER: t('admin.roles.OWNER'),
    TEACHER: t('admin.roles.TEACHER'),
    ADMIN: t('admin.roles.ADMIN'),
  }
  const formattedBirthday = user?.birthday
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        new Date(`${user.birthday}T00:00:00`),
      )
    : t('admin.notAvailable')

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm card-hover">
      <header className="flex items-start justify-between gap-sm">
        {loading ? (
          <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-5 w-1/2" />
            <Skeleton shape="line" className="mt-2 h-3 w-1/4" />
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="m-0 font-heading text-lg font-bold leading-snug text-heading">
              {user!.firstName} {user!.lastName}
            </h3>
            <p className="m-0 mt-2xs font-body text-body-sm text-neutral-500">
              {roleLabels[user!.role] ?? user!.role}
            </p>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-xs">
          {loading ? (
            <>
              <Skeleton shape="circle" className="size-10" />
              <Skeleton shape="circle" className="size-10" />
            </>
          ) : (
            <>
              <CardActionButton action="edit" label={t('admin.edit')} onClick={onEdit} />

              <CardActionButton
                action="delete"
                label={t('admin.delete')}
                title={isSelf ? t('admin.selfDeleteNotAllowed') : undefined}
                disabled={isSelf}
                onClick={onDelete}
              />
            </>
          )}
        </div>
      </header>

      {loading ? (
        <>
          <Skeleton shape="line" className="mt-md h-3 w-2/3" />
          <Skeleton shape="line" className="mt-sm h-3 w-1/3" />
        </>
      ) : (
        <>
          <p className="m-0 mt-md break-words font-body text-body-sm text-body-text">
            {user!.email}
          </p>

          <p className="m-0 mt-sm font-body text-body-sm text-body-text">
            <span className="font-semibold">{t('admin.birthday')}:</span>{' '}
            {formattedBirthday}
          </p>
        </>
      )}
    </article>
  )
}

export default TeacherCard
