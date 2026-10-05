import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ParentFormModal from "../components/ParentFormModal";
import ParentCard from "../components/ParentCard";
import Pagination from "../components/ui/Pagination.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";

import { parentService } from "../services/parent";
import { notify } from "../utils/notifications";
import { useParents } from "../hooks/useParents";

import type { Parent } from "../types/parent";


function AdminParentsPage() {
  const { parents, loading, error, totalPages, fetchParents } = useParents();
  const [currentPage, setCurrentPage] = useState(1);

  const { t } = useTranslation();

  // Guarda lo que escribe el usuario en el buscador
  const [searchTerm, setSearchTerm] = useState("");

  // Controla la apertura del formulario para agregar un padre
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Guarda el padre que se está editando
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

  // Obtiene los padres cuando carga la página
  useEffect(() => {
    void fetchParents(currentPage - 1);
  }, [currentPage]);

  // Filtra los padres por nombre, apellido, identificación o correo
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  const filteredParents = parents.filter((parent) => {
    const fullName = `${parent.firstName} ${parent.lastName}`.toLowerCase();

    return (
      fullName.includes(normalizedSearchTerm) ||
      parent.identification.toLowerCase().includes(normalizedSearchTerm) ||
      parent.email.toLowerCase().includes(normalizedSearchTerm)
    );
  });

  const confirmDeleteParent = async () => {
    if (!parentToDelete) return;

    try {
      await parentService.delete(parentToDelete.id);

      // Actualiza la lista después de eliminar
      await fetchParents();

      notify.success(t("admin.parents.deleteSuccessToastTitle"));
    } catch (error) {
      console.error("Error al eliminar el padre:", error);

      notify.error(t("admin.parents.deleteErrorToastTitle"));
      throw error;
    }
  };

  return (
    <AdminLayout>
      <section className="w-full">
        {/* Encabezado de la página */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          {/* Título y descripción */}
          <div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              {t("admin.parents.title")}
            </h1>

            <p className="mt-2 font-body text-body-text">
              {t("admin.parents.description")}
            </p>
          </div>

          {/* Acciones y buscador */}
          <div className="flex w-full items-center gap-3 md:w-auto">
            {/* Botón para agregar un padre */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
              aria-label="Agregar padre"
              title="Agregar padre"
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            {/* Buscador de padres */}
            <div className="flex h-11 w-full items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px]">
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

        {/* Estado de carga */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ParentCard loading />
            <ParentCard loading />
          </div>
        )}

        {/* Error al cargar */}
        {error && <p className="mt-8 font-body text-red-500">Error: {error}</p>}

        {/* Lista de padres */}
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
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

        {/* No existen padres */}
        {!loading && !error && parents.length === 0 && (
          <div className="mt-12 text-center">
            <p className="font-body text-body-text">
              No hay padres de familia registrados.
            </p>
          </div>
        )}

        {/* La búsqueda no encontró resultados */}
        {!loading &&
          !error &&
          parents.length > 0 &&
          filteredParents.length === 0 && (
            <div className="mt-12 text-center">
              <p className="font-body text-body-text">
                No se encontraron padres con esa búsqueda.
              </p>
            </div>
          )}

        {/* Modal para agregar un padre */}
        {isCreateModalOpen && (
          <ParentFormModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={fetchParents}
          />
        )}

        {/* Modal para editar un padre */}
        {editingParent && (
          <ParentFormModal
            parent={editingParent}
            onClose={() => setEditingParent(null)}
            onCreated={fetchParents}
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
