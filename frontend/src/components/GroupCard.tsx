
import {UsersIcon,UserIcon,FileTextIcon,} from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from './ui/Skeleton.tsx'
import CardActionButton from './ui/CardActionButton.tsx'
import Tag from './ui/Tag.tsx'
import type { Group } from '../types/group.ts'

    interface GroupCardProps {
    group?: Group
    onEdit?: (group: Group) => void
    onDelete?: (group: Group) => void
    onManageStudents?: (group: Group) => void
    onView?: (group: Group) => void
    loading?: boolean
    canManage?: boolean
    }

    function GroupCardSkeletonRow({ lastLineClass }: Readonly<{ lastLineClass: string }>) {
    return (
        <div className="flex items-start gap-3">
        <Skeleton
            shape="circle"
            className="mt-0.5 size-[18px] shrink-0"
        />

        <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-3 w-1/2" />
            <Skeleton shape="line" className={`mt-1 h-3 ${lastLineClass}`} />
        </div>
        </div>
    )
    }

    function GroupCardSkeleton({ withActions }: Readonly<{ withActions: boolean }>) {
    return (
        <article className="card-hover min-w-0 rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-6 w-2/3" />
            <Skeleton shape="line" className="mt-2 h-3 w-1/3" />
            </div>

            {withActions && (
                <div className="flex shrink-0 items-center gap-2">
                <Skeleton shape="circle" className="size-10" />
                <Skeleton shape="circle" className="size-10" />
                </div>
            )}
        </div>

        <div className="mt-6 flex flex-col gap-4">
            <GroupCardSkeletonRow lastLineClass="w-2/3" />
            <GroupCardSkeletonRow lastLineClass="w-1/3" />
            <GroupCardSkeletonRow lastLineClass="w-full" />
        </div>

        <div className="mt-6 border-t border-neutral-100 pt-4">
            <Skeleton shape="pill" className="h-7 w-32" />
        </div>
        </article>
    )
    }

    function GroupCard({
    group,
    onEdit,
    onDelete,
    onManageStudents,
    onView,
    loading = false,
    canManage = false,
    }: Readonly<GroupCardProps>) {
    const { t } = useTranslation()
    const [showStudents, setShowStudents] = useState(false)

    if (loading || !group) return <GroupCardSkeleton withActions={canManage} />

    let availabilityLabel = t('admin.groups.availableSpots', { count: group.availableSpots ?? 0 })
    if (group.availableSpots === null) availabilityLabel = t('admin.groups.unlimitedCapacity')
    else if (group.availableSpots === 0) availabilityLabel = t('admin.groups.full')

    return (
        <article className="card-hover min-w-0 rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
            <h2 className="break-words font-heading text-h5 font-bold text-heading">
                {group.name}
            </h2>

            <p className="mt-1 font-body text-body-sm text-body-text">
                {t('admin.groups.groupId')}: {group.id}
            </p>
            </div>

            {canManage &&
            onEdit && (
                <div className="flex shrink-0 items-center gap-2">
                <CardActionButton
                    action="edit"
                    label={`${t('admin.groups.editTitle')} ${group.name}`}
                    title={t('admin.groups.editTitle')}
                    onClick={() => onEdit(group)}
                />
                {onDelete && (
                    <CardActionButton
                    action="delete"
                    label={`${t('admin.groups.deleteTitle')} ${group.name}`}
                    title={t('admin.groups.deleteTitle')}
                    onClick={() => onDelete(group)}
                    />
                )}
                </div>
            )}
        </div>

        {/* Information */}
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
            <UserIcon
                size={18}
                className="mt-0.5 shrink-0 text-heading"
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <p className="font-body text-body-sm font-semibold text-heading">
                {t('admin.groups.teacher')}
                </p>

                <p className="break-words font-body text-body-sm text-body-text">
                {group.teacherNames.join(', ')}
                </p>
            </div>
            </div>

            <div className="flex items-start gap-3">
            <UsersIcon
                size={18}
                className="mt-0.5 shrink-0 text-heading"
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <p className="font-body text-body-sm font-semibold text-heading">
                {t('admin.groups.enrolledChildren')}
                </p>

                <p className="font-body text-body-sm text-body-text">
                {group.enrolledChildren}
                {group.maxCapacity !== null
                    ? ` / ${group.maxCapacity}`
                    : ` · ${t('admin.groups.unlimitedCapacity')}`}
                </p>
            </div>
            </div>

            <div className="flex items-start gap-3">
            <FileTextIcon
                size={18}
                className="mt-0.5 shrink-0 text-heading"
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <p className="font-body text-body-sm font-semibold text-heading">
                {t('admin.groups.descriptionLabel')}
                </p>

                <p className="break-words font-body text-body-sm text-body-text">
                {group.description ||
                    t('admin.groups.noDescription')}
                </p>
            </div>
            </div>

            {!canManage && showStudents && (
            <div className="flex items-start gap-3">
            <UsersIcon
                size={18}
                className="mt-0.5 shrink-0 text-heading"
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                {group.children.length === 0 ? (
                    <p className="font-body text-body-sm text-neutral-500">
                        {t('admin.groups.noStudents')}
                    </p>
                ) : (
                    <ul
                        aria-label={t('admin.groups.students')}
                        className="max-h-40 space-y-xs overflow-y-auto pr-xs"
                    >
                        {group.children.map((child) => (
                        <li key={child.id}>
                            <Link
                            to={`/admin/expedients?estudiante=${encodeURIComponent(child.studentId)}`}
                            aria-label={t('admin.groups.openExpedient', { name: child.fullName })}
                            className="group flex min-w-0 items-center justify-between gap-sm rounded-lg bg-neutral-50 px-sm py-xs font-body text-body-sm text-body-text transition-colors hover:bg-green-50 hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                            >
                            <span className="min-w-0 truncate group-hover:underline group-hover:underline-offset-2">{child.fullName}</span>
                            <span className="shrink-0 text-caption text-neutral-500">
                            {child.studentId}
                            </span>
                            </Link>
                        </li>
                        ))}
                    </ul>
                )}
            </div>
            </div>
            )}
        </div>

        <div className="mt-6 border-t border-neutral-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
            <Tag>{availabilityLabel}</Tag>

            <div className="flex flex-wrap items-center gap-md">
                {canManage && onManageStudents && (
                    <button
                    type="button"
                    onClick={() => onManageStudents(group)}
                    className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
                    >
                    {t('admin.groups.manageStudents')}
                    </button>
                )}

                {!canManage && (
                    <button
                    type="button"
                    onClick={() => setShowStudents((current) => !current)}
                    className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
                    aria-expanded={showStudents}
                    >
                    {showStudents
                        ? t('admin.groups.hideStudents')
                        : t('admin.groups.viewStudents')}
                    </button>
                )}

                {onView && (
                    <button
                    type="button"
                    onClick={() => onView(group)}
                    className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
                    >
                    {t('admin.groups.viewDetails')}
                    </button>
                )}
            </div>
            </div>
        </div>
        </article>
    )
}

export default GroupCard
