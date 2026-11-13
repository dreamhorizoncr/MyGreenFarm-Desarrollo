import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import ChildrenModuleTabs from "../components/ChildrenModuleTabs";
import EvaluationCard from "../components/EvaluationCard";
import EvaluationFormModal from "../components/EvaluationFormModal";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";
import Pagination from "../components/ui/Pagination";

import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useEvaluations } from "../hooks/useEvaluations";
import { useClientPagination } from "../hooks/useClientPagination";

import type { Evaluation } from "../types/evaluation";
import type { Expedient } from "../types/expedient";
import SkeletonList from "../components/ui/SkeletonList";
import { useSkeletonCount } from "../hooks/useSkeletonCount";
import StatusMessage from '../components/ui/StatusMessage.tsx'
import { ClipboardCheck, SearchX } from 'lucide-react'

function AdminEvaluationsPage() {
    const { t, i18n } = useTranslation();
    const {
        evaluations,
        sourceEvaluations,
        loading,
        error,
        fetchEvaluations,
    } = useEvaluations();

    const [expedients, setExpedients] = useState<Expedient[]>([]);
    const [loadingExpedients, setLoadingExpedients] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] =
        useState<Evaluation | null>(null);

    const [evaluationToDelete, setEvaluationToDelete] =
        useState<Evaluation | null>(null);

    useEffect(() => {
        void fetchEvaluations(i18n.language);

        const loadExpedients = async () => {
            try {
                setLoadingExpedients(true);
                const data = await expedientService.getExpedients(0, 100);
                setExpedients(data.content);
            } catch {
                notify.error(t("admin.evaluations.loadExpedientsError"));
            } finally {
                setLoadingExpedients(false);
            }
        };

        void loadExpedients();
    }, [i18n.language]);

    const getExpedient = (expedientId: string) => {
        return expedients.find(
            (expedient) => expedient.id === expedientId,
        );
    };

    const filteredEvaluations = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return evaluations.filter((evaluation, index) => {
            if (!search) return true;

            const expedient = getExpedient(evaluation.expedientId);
            const source = sourceEvaluations[index] ?? sourceEvaluations.find((item) => item.id === evaluation.id);

            return (
                expedient?.childName.toLowerCase().includes(search) ||
                expedient?.studentId.toLowerCase().includes(search) ||
                evaluation.evaluationDate.toLowerCase().includes(search) ||
                evaluation.communicationProgress.toLowerCase().includes(search) ||
                evaluation.languageProgress.toLowerCase().includes(search) ||
                evaluation.readingProgress.toLowerCase().includes(search) ||
                evaluation.motorProgress.toLowerCase().includes(search) ||
                evaluation.teacherObservation.toLowerCase().includes(search) ||
                (source?.communicationProgress ?? '').toLowerCase().includes(search) ||
                (source?.languageProgress ?? '').toLowerCase().includes(search) ||
                (source?.readingProgress ?? '').toLowerCase().includes(search) ||
                (source?.motorProgress ?? '').toLowerCase().includes(search) ||
                (source?.teacherObservation ?? '').toLowerCase().includes(search)
            );
        });
    }, [evaluations, sourceEvaluations, searchTerm, expedients]);

    const { currentPage, setPage, totalPages, pageItems: pagedEvaluations } = useClientPagination(filteredEvaluations);

    const handleEdit = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        setIsFormOpen(true);
    };

    const handleDelete = (evaluation: Evaluation) => {
        setEvaluationToDelete(evaluation);
    };

    const confirmDelete = async () => {
        if (!evaluationToDelete) return;

        try {
            await evaluationService.delete(evaluationToDelete.id);
            await fetchEvaluations(i18n.language);
            notify.success(t("admin.evaluations.deleteSuccess"));
        } catch (err) {
            notify.error(t("admin.evaluations.deleteError"));
            throw err;
        }
    };

    const deletingExpedient = evaluationToDelete
        ? getExpedient(evaluationToDelete.expedientId)
        : undefined;

    const isLoading = loading || loadingExpedients;

    const skeletonCount = useSkeletonCount("admin-evaluations", loading, filteredEvaluations.length, 10);

    return (
        <AdminLayout>
            <section className="w-full">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                            {t("admin.evaluations.title")}
                        </h1>

                        <p className="mt-2 font-body text-body-text">
                            {t("admin.evaluations.description")}
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-3 lg:w-auto lg:shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedEvaluation(null);
                                setIsFormOpen(true);
                            }}
                            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full blob-fill bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
                            aria-label={t("admin.evaluations.registerEvaluation")}
                            title={t("admin.evaluations.registerEvaluation")}
                        >
                            <span className="text-3xl font-light leading-none transition-transform duration-300 group-hover:rotate-90">
                                +
                            </span>
                        </button>

                        <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 lg:w-[clamp(220px,28vw,360px)] lg:flex-none">
                            <SearchIcon
                                size={18}
                                className="shrink-0 text-neutral-500"
                                aria-hidden="true"
                            />

                            <input
                                type="search"
                                placeholder={t("admin.evaluations.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                }}
                                aria-label={t("admin.evaluations.searchAriaLabel")}
                                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                            />
                        </div>
                    </div>
                </div>

                <ChildrenModuleTabs />

                {isLoading && (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <SkeletonList count={skeletonCount}>{() => <EvaluationCard loading />}</SkeletonList>
                    </div>
                )}

                {!isLoading && error && (
                    <StatusMessage variant="error" description={error} className="mt-8" />
                )}

                {!isLoading &&
                    !error &&
                    filteredEvaluations.length > 0 && (
                        <>
                            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {pagedEvaluations.map((evaluation: Evaluation) => (
                                    <EvaluationCard
                                        key={evaluation.id}
                                        evaluation={evaluation}
                                        expedient={getExpedient(evaluation.expedientId)}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </>
                    )}

                {!isLoading &&
                    !error &&
                    evaluations.length === 0 && (
                        <StatusMessage icon={ClipboardCheck} description={t("admin.evaluations.noEvaluations")} className="mt-8" />
                    )}

                {!isLoading &&
                    !error &&
                    evaluations.length > 0 &&
                    filteredEvaluations.length === 0 && (
                        <StatusMessage icon={SearchX} description={t("admin.evaluations.noResults")} className="mt-8" />
                    )}
            </section>

            <EvaluationFormModal
                isOpen={isFormOpen}
                evaluation={selectedEvaluation}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedEvaluation(null);
                }}
                onSaved={() => {
                    void fetchEvaluations(i18n.language);
                }}
            />

            {evaluationToDelete && (
                <DeleteConfirmModal
                    title={t("admin.evaluations.deleteTitle")}
                    message={
                        deletingExpedient
                            ? t("admin.evaluations.deleteMessageWithChild", {
                                date: evaluationToDelete.evaluationDate,
                                childName: deletingExpedient.childName,
                            })
                            : t("admin.evaluations.deleteMessageWithoutChild", {
                                date: evaluationToDelete.evaluationDate,
                            })
                    }
                    onConfirm={confirmDelete}
                    onClose={() => setEvaluationToDelete(null)}
                />
            )}
        </AdminLayout>
    );
}

export default AdminEvaluationsPage;