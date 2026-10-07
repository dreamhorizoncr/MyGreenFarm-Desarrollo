import { useEffect, useState } from "react";

import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";

import ExpedientFormModal from "../components/ExpedientFormModal";

import ExpedientCard from "../components/ExpedientCard";

import Pagination from "../components/ui/Pagination.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";

import { expedientService } from "../services/expedient";

import { notify } from "../utils/notifications.ts";

import { useExpedients } from "../hooks/useExpedients";

import type { Expedient } from "../types/expedient";

import { useTranslation } from "react-i18next";

function AdminExpedientsPage() {

  const { expedients, loading, error, totalPages, fetchExpedients } = useExpedients();
  const [currentPage, setCurrentPage] = useState(1);

  // Guarda lo que escribe el usuario en el buscador
  const [searchTerm, setSearchTerm] = useState("");

  // Controla la apertura del formulario para agregar un expediente
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Guarda el expediente que se está editando
  const [editingExpedient, setEditingExpedient] = useState<Expedient | null>(
    null,
  );

  const [expedientToDelete, setExpedientToDelete] = useState<Expedient | null>(null);

  const { t } = useTranslation();

  // Obtiene los expedientes cuando carga la página
  useEffect(() => {
    void fetchExpedients(currentPage - 1);
  }, [currentPage]);

  // Filtra los expedientes por el nombre del niño o niña
  const filteredExpedients = expedients.filter((expedient) =>
    expedient.childName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const confirmDeleteExpedient = async () => {
    if (!expedientToDelete) return;

    try {
      await expedientService.delete(expedientToDelete.id);

      // Actualiza la lista después de eliminar
      await fetchExpedients();

      notify.success(t("admin.expedients.deleteSuccessToastTitle"));
    } catch (error) {
      console.error("Error al eliminar el expediente:", error);

      notify.error(t("admin.expedients.deleteErrorToastTitle"));
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
              {t('admin.expedients.title')}
            </h1>

            <p className="mt-2 font-body text-body-text">
              {t('admin.expedients.description')}
            </p>
          </div>

          {/* Acciones y buscador */}
          <div className="flex w-full items-center gap-3 md:w-auto">
            {/* Botón para agregar un expediente */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
              aria-label="Agregar expediente"
              title="Agregar expediente"
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            {/* Buscador de expedientes */}
            <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px] md:flex-none">
              <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar niño..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar niño..."
                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExpedientCard loading />
            <ExpedientCard loading />
          </div>
        )}

        {/* Error al cargar */}
        {error && <p className="mt-8 font-body text-red-500">Error: {error}</p>}

        {/* Lista de expedientes */}
        {!loading && !error && filteredExpedients.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredExpedients.map((expedient) => (
                <ExpedientCard
                  key={expedient.id}
                  expedient={expedient}
                  // Abre el modal de edición
                  onEdit={setEditingExpedient}
                  // Elimina el expediente
                  onDelete={setExpedientToDelete}
                />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

        {/* No existen expedientes */}
        {!loading && !error && expedients.length === 0 && (
          <div className="mt-12 text-center">
            <p className="font-body text-body-text">
              {t("admin.expedients.noExpedients")}
            </p>
          </div>
        )}

        {/* La búsqueda no encontró resultados */}
        {!loading &&
          !error &&
          expedients.length > 0 &&
          filteredExpedients.length === 0 && (
            <div className="mt-12 text-center">
              <p className="font-body text-body-text">
                No se encontraron expedientes con ese nombre.
              </p>
            </div>
          )}

        {/* Modal para agregar un expediente */}
        {isCreateModalOpen && (
          <ExpedientFormModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={fetchExpedients}
          />
        )}

        {/* Modal para editar un expediente */}
        {editingExpedient && (
          <ExpedientFormModal
            expedient={editingExpedient}
            onClose={() => setEditingExpedient(null)}
            onCreated={fetchExpedients}
          />
        )}

        {expedientToDelete && (
          <DeleteConfirmModal
            title={t("admin.expedients.deleteModalTitle")}
            message={t("admin.expedients.deleteConfirmMessage", {
              name: expedientToDelete.childName,
            })}
            onConfirm={confirmDeleteExpedient}
            onClose={() => setExpedientToDelete(null)}
          />
        )}
      </section>
    </AdminLayout>
  );
}

export default AdminExpedientsPage;
