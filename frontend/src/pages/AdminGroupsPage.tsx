
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'

import AdminLayout from '../layout/AdminLayout.tsx'
import ChildrenModuleTabs from '../components/ChildrenModuleTabs.tsx'
import GroupCard from '../components/GroupCard.tsx'
import GroupFormModal from '../components/GroupFormModal.tsx'
import Pagination from '../components/ui/Pagination.tsx'

import { useGroups } from '../hooks/useGroups.ts'
import { userStorage } from '../utils/userStorage.ts'

import type { Group } from '../types/group.ts'
import StatusMessage from '../components/ui/StatusMessage.tsx'
import { UsersRound } from 'lucide-react'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import { groupService } from '../services/group.ts'
import { notify, notifyError } from '../utils/notifications.ts'

    const PAGE_SIZE = 10

    function AdminGroupsPage() {
    const { t, i18n } = useTranslation()

    const {
        groups,
        sourceGroups,
        loading,
        error,
        fetchGroups,
        refreshGroups,
    } = useGroups()

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)

    const role = userStorage.getUser()?.role
    const isOwner = role === 'OWNER'

    useEffect(() => {
        void fetchGroups(i18n.language)
    }, [fetchGroups, i18n.language])

    const filteredGroups = useMemo(() => {
        const query = searchTerm.trim().toLocaleLowerCase()

        if (!query) return groups

        return groups.filter((group) => {
        return (
            group.name.toLocaleLowerCase().includes(query) ||
            group.teacherNames.join('').toLocaleLowerCase().includes(query) ||
            (group.description ?? '').toLocaleLowerCase().includes(query) ||
            (group.children ?? []).some((child) =>
            child.fullName.toLocaleLowerCase().includes(query),
            )
        )
        })
    }, [groups, searchTerm])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredGroups.length / PAGE_SIZE),
    )

    const paginatedGroups = useMemo(() => {

        const start = (currentPage - 1) * PAGE_SIZE

        return filteredGroups.slice(start, start + PAGE_SIZE)
    }, [filteredGroups, currentPage])
    const skeletonCount = useSkeletonCount('admin-groups', loading, paginatedGroups.length, 4)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        if (currentPage > totalPages) {
        setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const handleCreate = () => {
        setSelectedGroup(null)
        setIsModalOpen(true)
    }

    const handleEdit = (group: Group) => {
        const originalGroup =
        sourceGroups.find((item) => item.id === group.id) ?? group

        setSelectedGroup(originalGroup)
        setIsModalOpen(true)
    }

    const handleDelete = async () => {
        if (!groupToDelete) return
        try {
            await groupService.delete(groupToDelete.id)
            notify.success(t('admin.groups.deleteSuccess'))
            void refreshGroups(i18n.language)
        } catch (err) {
            notifyError(t('admin.groups.deleteError'), err)
            throw err
        }
    }

    const handleClose = () => {
        setIsModalOpen(false)
    }

    const handleSaved = () => {
        void refreshGroups(i18n.language)
    }

    return (
        <AdminLayout>
        <section className="w-full min-w-0">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                {t('admin.groups.title')}
                </h1>

                <p className="mt-2 font-body text-body text-neutral-500">
                {t('admin.groups.description')}
                </p>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto lg:shrink-0">
                {isOwner && (
                <button
                    type="button"
                    onClick={handleCreate}
                    aria-label={t('admin.groups.addGroup')}
                    title={t('admin.groups.addGroup')}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-2xl font-light leading-none text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                >
                    +
                </button>
                )}

                <div className="relative min-w-0 flex-1 sm:w-[360px] sm:flex-none lg:w-[clamp(220px,28vw,360px)]">
                <SearchIcon
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t('admin.groups.searchPlaceholder')}
                    aria-label={t('admin.groups.searchPlaceholder')}
                    className="block h-11 w-full min-w-0 rounded-full border border-neutral-200 bg-white py-2 pl-12 pr-4 font-body text-body-sm text-heading outline-none transition-colors placeholder:text-neutral-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/15"
                />
                </div>
            </div>
            </div>

            {!isOwner && <ChildrenModuleTabs />}

            <div className="mt-6">
            {loading && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SkeletonList count={skeletonCount}>{(index) => <GroupCard key={index} loading canManage={isOwner} />}</SkeletonList>
                </div>
            )}
            {!loading && error && (
                <StatusMessage variant="error" />
            )}
            {!loading && !error && filteredGroups.length === 0 && (
                <StatusMessage icon={UsersRound} description={t('admin.groups.noResults')} />
            )}
            {!loading && !error && filteredGroups.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {paginatedGroups.map((group) => (
                    <GroupCard
                    key={group.id}
                    group={group}
                    canManage={isOwner}
                    onEdit={() => handleEdit(group)}
                    onDelete={isOwner ? () => setGroupToDelete(group) : undefined}
                    />
                ))}
                </div>
            )}
            </div>

            {!loading && !error && totalPages > 1 && (
            <div className="mt-8">
                <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />
            </div>
            )}

            {groupToDelete && (
            <DeleteConfirmModal
                title={t('admin.groups.deleteTitle')}
                message={t('admin.groups.deleteConfirm', { name: groupToDelete.name })}
                onConfirm={handleDelete}
                onClose={() => setGroupToDelete(null)}
            />
            )}

            {isOwner && (
            <GroupFormModal
                isOpen={isModalOpen}
                group={selectedGroup}
                onClose={handleClose}
                onSaved={handleSaved}
            />
            )}
        </section>
        </AdminLayout>
    )
}

export default AdminGroupsPage
