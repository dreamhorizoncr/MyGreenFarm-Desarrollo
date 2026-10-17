import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ParentFormModal from "../components/ParentFormModal";
import ParentCard from "../components/ParentCard";
import Pagination from "../components/ui/Pagination.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";

import { parentService } from "../services/parent";
import { notify, notifyError } from "../utils/notifications";
import { useParents } from "../hooks/useParents";

import type { Parent } from "../types/parent";
import { useSkeletonCount } from "../hooks/useSkeletonCount.ts";

function AdminParentsPage() {
    const { parents, loading, error, totalPages, fetchParents } = useParents();
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<Parent | null>(null);
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

    useEffect(() => {
        void fetchParents(currentPage - 1);
    }, [currentPage]);

    const filteredParents = parents.filter((parent) => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        const fullName = `${parent.firstName} ${parent.lastName}`.toLowerCase();

        return (
            fullName.includes(search) ||
            parent.identification.toLowerCase().includes(search) ||
            parent.email.toLowerCase().includes(search) ||
            parent.phoneNumber.toLowerCase().includes(search)
        );
    });

    const confirmDeleteParent = async () => {
        if (!parentToDelete) return;

        try {
            await parentService.delete(parentToDelete.id);
            await fetchParents(currentPage - 1);
            notify.success(t("admin.parents.deleteSuccessToastTitle"));
            setParentToDelete(null);
        } catch (error) {
            console.error("Error al eliminar el padre:", error);
            notify.error(t("admin.parents.deleteErrorToastTitle"));
            throw error;
        }
    };

    const skeletonCount = useSkeletonCount("admin-parents", loading, filteredParents.length, 2);

    return (
        <AdminLayout>
            <section className="w-full">
                {/* Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                            {t("admin.parents.title")}
                        </h1>
                        <p className="mt-2 font-body text-body text-neutral-500">
                            {t("admin.parents.description")}
                        </p>
                    </div>

                    {/* Acciones y Buscador */}
                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
                            aria-label={t("admin.parents.addTitle")}
                            title={t("admin.parents.addTitle")}
                        >
                            <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                                +
                            </span>
                        </button>

                        <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px] md:flex-none">
                            <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
                            <input
                                type="search"
                                placeholder={t("admin.parents.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label={t("admin.parents.searchPlaceholder")}
                                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ParentCard loading />
                        <ParentCard loading />
                    </div>
                )}

                {/* Error */}
                {error && <p className="mt-8 font-body text-red-500">Error: {error}</p>}

                {/* Lista de padres con Paginación del Servidor */}
                {!loading && !error && filteredParents.length > 0 && (
                    <>
                        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {filteredParents.map((parent) => (
                                <ParentCard
                                    key={parent.id}
                                    parent={parent}
                                    onEdit={setEditingParent}
                                    onDelete={setParentToDelete}
                                />
                            ))}
                        </div>

                        {/* 💡 El componente Pagination recibe el totalPages real del backend */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                {/* No hay padres registrados */}
                {!loading && !error && parents.length === 0 && searchTerm === "" && (
                    <div className="mt-12 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                        <p className="font-body text-body text-body-text">
                            No hay padres de familia registrados.
                        </p>
                    </div>
                )}

                {/* Búsqueda sin resultados */}
                {!loading &&
                    !error &&
                    parents.length > 0 &&
                    filteredParents.length === 0 && (
                        <div className="mt-12 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                            <p className="font-body text-body text-body-text">
                                No se encontraron padres con esa búsqueda.
                            </p>
                        </div>
                    )}

                {/* Modal Crear */}
                {isCreateModalOpen && (
                    <ParentFormModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreated={() => fetchParents(currentPage - 1)}
                    />
                )}

                {/* Modal Editar */}
                {editingParent && (
                    <ParentFormModal
                        parent={editingParent}
                        onClose={() => setEditingParent(null)}
                        onCreated={() => fetchParents(currentPage - 1)}
                    />
                )}

                {/* Modal Eliminar */}
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