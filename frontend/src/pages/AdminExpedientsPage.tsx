import StatusMessage from '../components/ui/StatusMessage.tsx'
import { FolderOpen, SearchX } from 'lucide-react'
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ChildrenModuleTabs from "../components/ChildrenModuleTabs";

import ExpedientFormModal from "../components/ExpedientFormModal";

import ExpedientCard from "../components/ExpedientCard";

import Pagination from "../components/ui/Pagination.tsx";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal.tsx";

import { expedientService } from "../services/expedient";

import { notify, notifyError } from "../utils/notifications.ts";

import { useExpedients } from "../hooks/useExpedients";

import type { Expedient } from "../types/expedient";

import { useTranslation } from "react-i18next";
import SkeletonList from "../components/ui/SkeletonList.tsx";
import { useSkeletonCount } from "../hooks/useSkeletonCount.ts";

function AdminExpedientsPage() {

  const { expedients, sourceExpedients, loading, error, totalPages, fetchExpedients } = useExpedients();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingExpedient, setEditingExpedient] = useState<Expedient | null>(
    null,
  );

  const [expedientToDelete, setExpedientToDelete] = useState<Expedient | null>(null);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    void fetchExpedients(currentPage - 1, i18n.language);
  }, [currentPage, i18n.language]);

  const [searchParams, setSearchParams] = useSearchParams();
  const featuredStudentId = searchParams.get("estudiante");
  const [featured, setFeatured] = useState<{ key: string; expedient: Expedient | null } | null>(null);
  const [featuredRefresh, setFeaturedRefresh] = useState(0);
  const featuredKey = featuredStudentId ? `${featuredStudentId}:${featuredRefresh}` : null;

  useEffect(() => {
    if (!featuredStudentId || !featuredKey) return;
    let current = true;
    expedientService.getByStudentId(featuredStudentId)
      .then((expedient) => { if (current) setFeatured({ key: featuredKey, expedient }); })
      .catch(() => { if (current) setFeatured({ key: featuredKey, expedient: null }); });
    return () => { current = false; };
  }, [featuredStudentId, featuredKey]);

  const featuredState = featured?.key === featuredKey ? featured : null;
  const featuredLoading = featuredStudentId !== null && featuredState === null;
  const featuredExpedient = featuredState?.expedient ?? null;
  const featuredMissing = featuredState !== null && featuredState.expedient === null;
  const clearFeatured = () => setSearchParams({}, { replace: true });

  const refreshAll = () => {
    void fetchExpedients(currentPage - 1, i18n.language);
    setFeaturedRefresh((value) => value + 1);
  };

  const filteredExpedients = expedients.filter((expedient, index) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    const source = sourceExpedients[index] ?? sourceExpedients.find((item) => item.id === expedient.id);
    return (
      expedient.childName.toLowerCase().includes(search) ||
      (expedient.generalObservations ?? '').toLowerCase().includes(search) ||
      (source?.generalObservations ?? '').toLowerCase().includes(search)
    );
  });

  const confirmDeleteExpedient = async () => {
    if (!expedientToDelete) return;

    try {
      await expedientService.delete(expedientToDelete.id);

      if (featuredExpedient?.id === expedientToDelete.id) clearFeatured();
      await fetchExpedients(currentPage - 1, i18n.language);

      notify.success(t("admin.expedients.deleteSuccessToastTitle"));
    } catch (error) {
      console.error("Error deleting the record:", error);

      notifyError(t("admin.expedients.deleteErrorToastTitle"), error);
      throw error;
    }
  };

  const skeletonCount = useSkeletonCount("admin-expedients", loading, filteredExpedients.length, 2);

  return (
    <AdminLayout>
      <section className="w-full">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
              {t('admin.expedients.title')}
            </h1>

            <p className="mt-2 font-body text-body text-neutral-500">
              {t('admin.expedients.description')}
            </p>
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto lg:shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full blob-fill bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
              aria-label={t("admin.expedients.addTitle")}
              title={t("admin.expedients.addTitle")}
            >
              <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                +
              </span>
            </button>

            <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 lg:w-[clamp(220px,28vw,360px)] lg:flex-none">
              <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
              <input
                type="search"
                placeholder={t("admin.children.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (featuredStudentId) clearFeatured();
                }}
                aria-label={t("admin.children.searchPlaceholder")}
                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text-dark outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>

        <ChildrenModuleTabs />

        {featuredStudentId && featuredLoading && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExpedientCard loading />
          </div>
        )}

        {featuredStudentId && !featuredLoading && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-sm">
            <p className="m-0 font-body text-body-sm text-neutral-500">
              {featuredMissing
                ? t("admin.expedients.featuredMissing", { studentId: featuredStudentId })
                : t("admin.expedients.featuredTitle", { name: featuredExpedient?.childName })}
            </p>
            <div className="flex items-center gap-md">
              {featuredMissing && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
                >
                  {t("admin.expedients.addTitle")}
                </button>
              )}
              <button
                type="button"
                onClick={clearFeatured}
                className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
              >
                {t("admin.expedients.showAll")}
              </button>
            </div>
          </div>
        )}

        {featuredExpedient && (
          <div className="mt-md grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExpedientCard
              expedient={featuredExpedient}
              onEdit={setEditingExpedient}
              onDelete={setExpedientToDelete}
            />
          </div>
        )}

        {!featuredStudentId && (
          <>
            {loading && (
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SkeletonList count={skeletonCount}>{() => <ExpedientCard loading />}</SkeletonList>
              </div>
            )}

            {error && <StatusMessage variant="error" description={error} className="mt-8" />}

            {!loading && !error && filteredExpedients.length > 0 && (
              <>
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {filteredExpedients.map((expedient) => (
                    <ExpedientCard
                      key={expedient.id}
                      expedient={expedient}
                      onEdit={setEditingExpedient}
                      onDelete={setExpedientToDelete}
                    />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}

            {!loading && !error && expedients.length === 0 && (
              <StatusMessage icon={FolderOpen} description={t("admin.expedients.noExpedients")} className="mt-8" />
            )}

            {!loading && !error && expedients.length > 0 && filteredExpedients.length === 0 && (
              <StatusMessage icon={SearchX} description={t("admin.expedients.noMatches")} className="mt-8" />
            )}
          </>
        )}

        {isCreateModalOpen && (
          <ExpedientFormModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={refreshAll}
          />
        )}

        {editingExpedient && (
          <ExpedientFormModal
            expedient={editingExpedient}
            onClose={() => setEditingExpedient(null)}
            onCreated={refreshAll}
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
