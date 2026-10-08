import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import EvaluationCard from "../components/EvaluationCard";
import EvaluationFormModal from "../components/EvaluationFormModal";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";

import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useEvaluations } from "../hooks/useEvaluations";

import type { Evaluation } from "../types/evaluation";
import type { Expedient } from "../types/expedient";


    function AdminEvaluationsPage() {
    const { t } = useTranslation();
    const {
        evaluations,
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
        void fetchEvaluations();

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
    }, []);

    const getExpedient = (expedientId: string) => {
        return expedients.find(
        (expedient) => expedient.id === expedientId,
        );
    };

    const filteredEvaluations = evaluations.filter((evaluation) => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;

        const expedient = getExpedient(evaluation.expedientId);

        return (
        expedient?.childName.toLowerCase().includes(search) ||
        expedient?.studentId.toLowerCase().includes(search) ||
        evaluation.evaluationDate.toLowerCase().includes(search) ||
        evaluation.communicationProgress.toLowerCase().includes(search) ||
        evaluation.languageProgress.toLowerCase().includes(search) ||
        evaluation.readingProgress.toLowerCase().includes(search) ||
        evaluation.motorProgress.toLowerCase().includes(search) ||
        evaluation.teacherObservation.toLowerCase().includes(search)
        );
    });

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

        await fetchEvaluations();

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

    return (
        <AdminLayout>
            <section className="w-full">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                    {t("admin.evaluations.title")}
                </h1>

                <p className="mt-2 font-body text-body text-neutral-500">
                    Registra, consulta y administra el progreso de los niños.
                <p className="mt-2 font-body text-body-text">
                    {t("admin.evaluations.description")}
                </p>
                </div>

                {/* Acciones + buscador */}
                <div className="flex w-full items-center gap-3 md:w-auto">
                <button
                    type="button"
                    onClick={() => {
                    setSelectedEvaluation(null);
                    setIsFormOpen(true);
                    }}
                    className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-300 hover:scale-105 hover:bg-orange-600"
                    aria-label={t("admin.evaluations.registerEvaluation")}
                    title={t("admin.evaluations.registerEvaluation")}
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
                    placeholder={t("admin.evaluations.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label={t("admin.evaluations.searchAriaLabel")}
                    className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                    />
                </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <EvaluationCard loading />
                <EvaluationCard loading />
                </div>
            )}

            {/* Error */}
            {!isLoading && error && (
                <div className="mt-8 rounded-2xl border border-danger-100 bg-white p-6">
                <p className="font-body text-body-sm text-danger">
                    {error}
                </p>
                </div>
            )}

            {/* Evaluaciones */}
            {!isLoading &&
                !error &&
                filteredEvaluations.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {filteredEvaluations.map((evaluation) => (
                    <EvaluationCard
                        key={evaluation.id}
                        evaluation={evaluation}
                        expedient={getExpedient(evaluation.expedientId)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                    ))}
                </div>
                )}

            {/* No hay evaluaciones */}
            {!isLoading &&
                !error &&
                evaluations.length === 0 && (
                <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                    <p className="font-body text-body text-body-text">
                    {t("admin.evaluations.noEvaluations")}
                    </p>
                </div>
                )}

            {/* Búsqueda sin resultados */}
            {!isLoading &&
                !error &&
                evaluations.length > 0 &&
                filteredEvaluations.length === 0 && (
                <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                    <p className="font-body text-body text-body-text">
                    {t("admin.evaluations.noResults")}
                    </p>
                </div>
                )}
            </section>

            {/* Crear / editar */}
            <EvaluationFormModal
            isOpen={isFormOpen}
            evaluation={selectedEvaluation}
            onClose={() => {
                setIsFormOpen(false);
                setSelectedEvaluation(null);
            }}
            onSaved={() => {
                void fetchEvaluations();
            }}
            />

            {/* Eliminar */}
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