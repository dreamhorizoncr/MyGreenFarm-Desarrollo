import { useEffect, useState } from "react";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ChildFormModal from "../components/ChildFormModal";
import ChildCard from "../components/ChildCard";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

import { childService } from "../services/child";
import { notify } from "../utils/notifications";
import { useChildren } from "../hooks/useChildren";

import type { Child } from "../types/child";
import { useTranslation } from "react-i18next";

function AdminChildrenPage() {
  const { children, loading, error, fetchChildren } = useChildren();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [childToDelete, setChildToDelete] = useState<Child | null>(null)

  const { t } = useTranslation();

  useEffect(() => {
    void fetchChildren();
  }, []);

  const filteredChildren = children.filter((child) => {
    const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      fullName.includes(search) ||
      child.studentId.toLowerCase().includes(search) ||
      child.parentName.toLowerCase().includes(search)
    );
  });

  const handleEdit = (child: Child) => {
    setSelectedChild(child)
    setIsFormOpen(true)
  }

  const handleDelete = (child: Child) => {
  setChildToDelete(child)
}

  const confirmDelete = async () => {
    if (!childToDelete) return

    try {
      await childService.delete(childToDelete.id)

      await fetchChildren()

      notify.success('Niño eliminado correctamente')
    } catch (err) {
      notify.error('No se pudo eliminar el niño')
      throw err
    }
  }

  return (
    <AdminLayout>
      <section className="w-full">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
              {t('admin.children.title')}
            </h1>

            <p className="mt-2 font-body text-body text-neutral-500">
              {t('admin.children.description')}
            </p>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <button
              type="button"
              onClick={()=>{
                setSelectedChild(null)
                setIsFormOpen(true)
              }}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
              aria-label={t('admin.children.addChild')}
              title={t('admin.children.addChild')}
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px] md:flex-none">
              <SearchIcon
                size={18}
                className="shrink-0 text-neutral-500"
                aria-hidden="true"
              />

              <input
                type="search"
                placeholder={t('admin.children.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label={t('admin.children.searchPlaceholder')}
                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChildCard loading />
            <ChildCard loading />
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-danger-100 bg-white p-6">
            <p className="font-body text-body-sm text-danger">{error}</p>
          </div>
        )}

        {!loading && !error && filteredChildren.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredChildren.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!loading && !error && children.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
            <p className="font-body text-body text-body-text">
              {t('admin.children.noResults')}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          children.length > 0 &&
          filteredChildren.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <p className="font-body text-body text-body-text">
                {t('admin.children.noResults')}
              </p>
            </div>
          )}
      </section>

      <ChildFormModal
        isOpen={isFormOpen}
        child={selectedChild}
        onClose={() => {
            setIsFormOpen(false)
            setSelectedChild(null)
          }}
            onSaved={() => {void fetchChildren()}}
      />

      {childToDelete && (
        <DeleteConfirmModal
          title={t('admin.children.deleteTitle')}
          message={t('admin.children.deleteMessage', { firstName: childToDelete.firstName, lastName: childToDelete.lastName })}
          onConfirm={confirmDelete}
          onClose={() => setChildToDelete(null)}
        />
      )}

    </AdminLayout>
  );
}

export default AdminChildrenPage;
