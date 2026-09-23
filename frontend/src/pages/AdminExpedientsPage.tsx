import { useEffect, useState } from "react";

import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";

import ExpedientFormModal from "../components/ExpedientFormModal";

import ExpedientCard from "../components/ExpedientCard";

import { expedientService } from "../services/expedient";

import { notify } from "../utils/notifications.ts";

import { useExpedients } from "../hooks/useExpedients";

import type { Expedient } from "../types/expedient";

import { useTranslation } from "react-i18next";

function AdminExpedientsPage() {

  const { expedients, loading, error, fetchExpedients } = useExpedients();

  // Guarda lo que escribe el usuario en el buscador
  const [searchTerm, setSearchTerm] = useState("");

  // Controla la apertura del formulario para agregar un expediente
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Guarda el expediente que se está editando
  const [editingExpedient, setEditingExpedient] = useState<Expedient | null>(
    null,
  );

  const { t } = useTranslation();

  // Obtiene los expedientes cuando carga la página
  useEffect(() => {
    fetchExpedients();
  }, []);

  // Filtra los expedientes por el nombre del niño o niña
  const filteredExpedients = expedients.filter((expedient) =>
    expedient.childName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Elimina un expediente
  const handleDelete = async (expedient: Expedient) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el expediente de ${expedient.childName}?`,
    );

    // Si cancela, no elimina nada
    if (!confirmed) return;

    try {
      await expedientService.delete(expedient.id);

      // Actualiza la lista después de eliminar
      await fetchExpedients();

      notify.success(t("admin.expedients.deleteSuccessToastTitle"));
    } catch (error) {
      console.error("Error al eliminar el expediente:", error);

      notify.error(t("admin.expedients.deleteErrorToastTitle"));
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
              className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-heading text-white transition-all duration-300 hover:scale-105"
              aria-label="Agregar expediente"
              title="Agregar expediente"
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            {/* Buscador de expedientes */}
            <div className="relative w-full md:w-[360px]">
              <input
                type="text"
                placeholder="Buscar niño..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-heading bg-white px-5 py-3 pr-12 font-body text-body-text outline-none"
              />

              <SearchIcon
                size={20}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-heading"
              />
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <p className="mt-8 font-body text-body-text">
            Cargando expedientes...
          </p>
        )}

        {/* Error al cargar */}
        {error && <p className="mt-8 font-body text-red-500">Error: {error}</p>}

        {/* Lista de expedientes */}
        {!loading && !error && filteredExpedients.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredExpedients.map((expedient) => (
              <ExpedientCard
                key={expedient.id}
                expedient={expedient}
                // Abre el modal de edición
                onEdit={setEditingExpedient}
                // Elimina el expediente
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* No existen expedientes */}
        {!loading && !error && expedients.length === 0 && (
          <div className="mt-12 text-center">
            <p className="font-body text-body-text">
              No hay expedientes académicos registrados.
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
      </section>
    </AdminLayout>
  );
}

export default AdminExpedientsPage;
