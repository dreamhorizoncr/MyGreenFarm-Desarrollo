
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
            group.teacherName.toLocaleLowerCase().includes(query) ||
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

    const handleClose = () => {
        setIsModalOpen(false)
    }

    const handleSaved = () => {
        void refreshGroups(i18n.language)
    }

    return (
        <AdminLayout>
        <section className="w-full min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                {t('admin.groups.title')}
                </h1>

                <p className="mt-2 font-body text-body text-neutral-500">
                {t('admin.groups.description')}
                </p>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                {/* Add group */}
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

                {/* Search */}
                <div className="relative min-w-0 flex-1 sm:w-[360px] sm:flex-none">
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

            {/* Tabs */}
            <ChildrenModuleTabs />

            {/* Content */}
            <div className="mt-6">
            {loading ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                    <GroupCard key={index} loading />
                ))}
                </div>
            ) : error ? (
                <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-body text-body-sm text-red-700"
                >
                {t('admin.groups.loadError')}
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center font-body text-body-sm text-neutral-500">
                {t('admin.groups.noResults')}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {paginatedGroups.map((group) => (
                    <GroupCard
                    key={group.id}
                    group={group}
                    canManage={isOwner}
                    onEdit={() => handleEdit(group)}
                    />
                ))}
                </div>
            )}
            </div>

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
            <div className="mt-8">
                <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />
            </div>
            )}

            {/* Form */}
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
