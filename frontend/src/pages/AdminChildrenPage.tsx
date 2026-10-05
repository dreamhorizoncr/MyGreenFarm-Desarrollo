import { useEffect, useState } from "react";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ChildFormModal from "../components/ChildFormModal";
import ChildCard from "../components/ChildCard";
import Skeleton from "../components/ui/Skeleton";

import { childService } from "../services/child";
import { notify } from "../utils/notifications";
import { useChildren } from "../hooks/useChildren";

import type { Child } from "../types/child";
import { useTranslation } from "react-i18next";

function ChildCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-32" />

      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function AdminChildrenPage() {
  const { children, loading, error, fetchChildren } = useChildren();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
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
  setDeleteModalOpen(true)
}

  const confirmDelete = async () => {
    if (!childToDelete) return

    try {
      await childService.delete(childToDelete.id)

      setDeleteModalOpen(false)
      setChildToDelete(null)

      await fetchChildren()

      notify.success('Niño eliminado correctamente')
    } catch {
      notify.error('No se pudo eliminar el niño')
    }
  }

  return (
    <AdminLayout>
      <section className="w-full">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-heading">
              {t('admin.children.title')}
            </h1>

            <p className="mt-2 font-body text-body-text">
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

            <div className="flex h-11 w-full items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px]">
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
            <ChildCardSkeleton />
            <ChildCardSkeleton />
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

      {deleteModalOpen && childToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]">
          <div className="w-full max-w-[430px] rounded-[20px] bg-white p-[28px] shadow-lg">
            <h2 className="m-0 font-heading text-[24px] font-bold text-heading">
                {t('admin.children.deleteTitle')}
            </h2>

            <p className="mt-[12px] font-body text-body-sm text-neutral-600">
              {t('admin.children.deleteMessage', { firstName: childToDelete.firstName, lastName: childToDelete.lastName })}
            </p>

          <div className="mt-[28px] flex justify-end gap-[12px]">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false)
                setChildToDelete(null)
              }}
              className="rounded-full border border-neutral-300 px-[18px] py-[9px] font-body text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
              >
              {t('admin.children.cancel')}
            </button>

            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="rounded-full bg-red-500 px-[18px] py-[9px] font-body text-body-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              {t('admin.children.delete')}
            </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminChildrenPage;
