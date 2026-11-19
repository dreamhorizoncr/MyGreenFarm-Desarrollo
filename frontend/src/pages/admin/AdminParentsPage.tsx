import StatusMessage from '../../components/ui/StatusMessage.tsx'
import { SearchX, UsersRound } from 'lucide-react'
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../../layout/AdminLayout";
import ParentFormModal from "../../components/parents/ParentFormModal";
import ParentCard from "../../components/parents/ParentCard";
import Pagination from "../../components/ui/Pagination.tsx";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal.tsx";

import { parentService } from "../../services/parent";
import { notify, notifyError } from "../../utils/notifications";
import { useParents } from "../../hooks/useParents";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.ts";

import type { Parent } from "../../types/parent";
import { useSkeletonCount } from "../../hooks/useSkeletonCount.ts";
import SkeletonList from "../../components/ui/SkeletonList.tsx";

/** Admin page of the parents: search and the forms to add, edit and delete them. */
function AdminParentsPage() {
    const { parents, loading, error, totalPages, fetchParents } = useParents();
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<Parent | null>(null);
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

    // the search runs in the backend over every parent, not only the loaded page
    const search = useDebouncedValue(searchTerm.trim());

    useEffect(() => {
        void fetchParents(currentPage - 1, false, search);
    }, [currentPage, fetchParents, search]);

    const confirmDeleteParent = async () => {
        if (!parentToDelete) return;

        try {
            await parentService.delete(parentToDelete.id);
            await fetchParents(currentPage - 1, true, search);
            notify.success(t("admin.parents.deleteSuccessToastTitle"));
            setParentToDelete(null);
        } catch (error) {
            notifyError(t("admin.parents.deleteErrorToastTitle"), error);
            throw error;
        }
    };

    const skeletonCount = useSkeletonCount("admin-parents", loading, parents.length, 2);

    return (
        <AdminLayout>
            <section className="w-full">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                            {t("admin.parents.title")}
                        </h1>
                        <p className="mt-2 font-body text-body text-neutral-500">
                            {t("admin.parents.description")}
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-3 lg:w-auto lg:shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full blob-fill bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
                            aria-label={t("admin.parents.addTitle")}
                            title={t("admin.parents.addTitle")}
                        >
                            <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                                +
                            </span>
                        </button>

                        <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 lg:w-[clamp(220px,28vw,360px)] lg:flex-none">
                            <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t("admin.parents.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t("admin.parents.searchPlaceholder")}
                                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                            />
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <SkeletonList count={skeletonCount}>{() => <ParentCard loading />}</SkeletonList>
                    </div>
                )}

                {error && <StatusMessage variant="error" description={error} className="mt-8" />}

                {!loading && !error && parents.length > 0 && (
                    <>
                        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {parents.map((parent) => (
                                <ParentCard
                                    key={parent.id}
                                    parent={parent}
                                    onEdit={setEditingParent}
                                    onDelete={setParentToDelete}
                                />
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                {!loading && !error && parents.length === 0 && search === "" && (
                    <StatusMessage icon={UsersRound} description={t('admin.parents.empty')} className="mt-8" />
                )}


                {!loading &&
                    !error &&
                    parents.length === 0 &&
                    search !== "" && (
                        <StatusMessage icon={SearchX} description={t('admin.parents.noMatches')} className="mt-8" />
                    )}

                {isCreateModalOpen && (
                    <ParentFormModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreated={() => fetchParents(currentPage - 1, true, search)}
                    />
                )}

                {editingParent && (
                    <ParentFormModal
                        parent={editingParent}
                        onClose={() => setEditingParent(null)}
                        onCreated={() => fetchParents(currentPage - 1, true, search)}
                    />
                )}

                {parentToDelete && (
                    <DeleteConfirmModal
                        title={t("admin.parents.deleteModalTitle")}
                        message={t("admin.parents.deleteConfirmMessage", {
                            name: `${parentToDelete.firstName} ${parentToDelete.lastName}`,
                        })}
                        onConfirm={confirmDeleteParent}
                        onClose={() => setParentToDelete(null)}
                    />
                )}
            </section>
        </AdminLayout>
    );
}

export default AdminParentsPage;