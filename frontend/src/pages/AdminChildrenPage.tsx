import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ChildrenModuleTabs from "../components/ChildrenModuleTabs";
import Select from "../components/ui/Select.tsx";
import ChildFormModal from "../components/ChildFormModal";
import ChildCard from "../components/ChildCard";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";
import Pagination from "../components/ui/Pagination";

import { childService } from "../services/child";
import { notify, notifyError } from "../utils/notifications";
import { useChildren } from "../hooks/useChildren";

import type { Child, ChildStatusFilter } from "../types/child";
import { useTranslation } from "react-i18next";
import SkeletonList from "../components/ui/SkeletonList.tsx";
import { useSkeletonCount } from "../hooks/useSkeletonCount.ts";
import StatusMessage from '../components/ui/StatusMessage.tsx'
import { Baby } from 'lucide-react'

const statusFilterLabels = {
  ALL: 'admin.children.statusFilters.all',
  ACTIVE: 'admin.children.statusFilters.active',
  INACTIVE: 'admin.children.statusFilters.inactive',
} as const satisfies Record<ChildStatusFilter, string>

function AdminChildrenPage() {
  const { children, sourceChildren, loading, error, fetchChildren, invalidateCache, totalPages } = useChildren();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ChildStatusFilter>("ACTIVE");

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    void fetchChildren(currentPage - 1, i18n.language, statusFilter);
  }, [currentPage, fetchChildren, i18n.language, statusFilter]);

  const refreshChildren = () => {
    invalidateCache()
    if (currentPage === 1) {
      return fetchChildren(0, i18n.language, statusFilter)
    }
    setCurrentPage(1)
    return Promise.resolve()
  }

  const filteredChildren = useMemo(() => {
    return children.filter((child, index) => {
      const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const search = searchTerm.trim().toLowerCase();
      if (!search) return true;

      const source = sourceChildren[index] ?? sourceChildren.find((item) => item.id === child.id);

      return (
        fullName.includes(search) ||
        child.studentId.toLowerCase().includes(search) ||
        child.parentName.toLowerCase().includes(search) ||
        (child.medicalNotes ?? '').toLowerCase().includes(search) ||
        (source?.medicalNotes ?? '').toLowerCase().includes(search)
      );
    });
  }, [children, sourceChildren, searchTerm]);

  const getSourceChild = (id: number) => sourceChildren.find((item) => item.id === id) ?? children.find((item) => item.id === id) ?? null

  const handleEdit = (child: Child) => {
    setSelectedChild(getSourceChild(child.id))
    setIsFormOpen(true)
  }

  const handleDelete = (child: Child) => {
    setChildToDelete(child)
  }

  const confirmDelete = async () => {
    if (!childToDelete) return

    try {
      await childService.delete(childToDelete.id)
      await refreshChildren()
      notify.success(t("admin.children.deleteSuccess"))
      setChildToDelete(null)
    } catch (err) {
      notifyError(t("admin.children.deleteError"), err)
      throw err
    }
  }

  const skeletonCount = useSkeletonCount("admin-children", loading, filteredChildren.length, 2);

  return (
    <AdminLayout>
      <section className="w-full">
        <div>
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t('admin.children.title')}
          </h1>

          <p className="mt-2 font-body text-body text-neutral-500">
            {t('admin.children.description')}
          </p>
        </div>

        <div className="mb-lg mt-lg flex flex-wrap items-center justify-between gap-md">
          <ChildrenModuleTabs className="max-w-full" />

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-md">
          <button
            type="button"
            onClick={() => {
              setSelectedChild(null)
              setIsFormOpen(true)
            }}
            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full blob-fill bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
            aria-label={t('admin.children.addChild')}
            title={t('admin.children.addChild')}
          >
            <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
              +
            </span>
          </button>

          <div className="flex h-11 min-w-0 flex-1 basis-48 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:max-w-[420px]">
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
              className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text-dark outline-none placeholder:text-neutral-400"
            />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as ChildStatusFilter)
                setCurrentPage(1)
              }}
              options={(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => ({ value: status, label: t(statusFilterLabels[status]) }))}
              className="w-full rounded-full border border-neutral-200 bg-white py-sm pl-md pr-lg"
              aria-label={t('admin.children.statusFilterLabel')}
            />
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonList count={skeletonCount}>{() => <ChildCard loading />}</SkeletonList>
          </div>
        )}

        {!loading && error && (
          <StatusMessage variant="error" description={error} />
        )}

        {!loading && !error && (
          filteredChildren.length === 0 ? (
            <StatusMessage icon={Baby} description={t('admin.children.noResults')} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {filteredChildren.map((child: Child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )
        )}
      </section>

      <ChildFormModal
        isOpen={isFormOpen}
        child={selectedChild}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedChild(null)
        }}
        onSaved={() => {
          void refreshChildren()
        }}
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