import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ParentFormModal from "../components/ParentFormModal";
import ParentCard from "../components/ParentCard";

import { parentService } from "../services/parent";
import { notify } from "../utils/notifications";
import { useParents } from "../hooks/useParents";

import type { Parent } from "../types/parent";

function AdminParentsPage() {
  const { parents, loading, error, fetchParents } = useParents();

  const { t } = useTranslation();

  // Guarda lo que escribe el usuario en el buscador
  const [searchTerm, setSearchTerm] = useState("");

  // Controla la apertura del formulario para agregar un padre
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Guarda el padre que se está editando
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  // Obtiene los padres cuando carga la página
  useEffect(() => {
    void fetchParents();
  }, []);

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

  // Elimina un padre
  const handleDelete = async (parent: Parent) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar a ${parent.firstName} ${parent.lastName}?`,
    );

    if (!confirmed) return;

    try {
      await parentService.delete(parent.id);

      // Actualiza la lista después de eliminar
      await fetchParents();

      notify.success(t("admin.parents.deleteSuccessToastTitle"));
    } catch (error) {
      console.error("Error al eliminar el padre:", error);

      notify.error(t("admin.parents.deleteErrorToastTitle"));
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
              className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-heading text-white transition-all duration-300 hover:scale-105"
              aria-label="Agregar padre"
              title="Agregar padre"
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            {/* Buscador de padres */}
            <div className="relative w-full md:w-[360px]">
              <input
                type="text"
                placeholder={t("admin.parents.searchPlaceholder")}
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
            Cargando padres de familia...
          </p>
        )}

        {/* Error al cargar */}
        {error && <p className="mt-8 font-body text-red-500">Error: {error}</p>}

        {/* Lista de padres */}
        {!loading && !error && filteredParents.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredParents.map((parent) => (
              <ParentCard
                key={parent.id}
                parent={parent}
                onEdit={setEditingParent}
                onDelete={handleDelete}
              />
            ))}
          </div>
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
      </section>
    </AdminLayout>
  );
}

export default AdminParentsPage;
