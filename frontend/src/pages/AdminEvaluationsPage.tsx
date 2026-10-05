import { useEffect, useState } from "react";
import { SearchIcon } from "@animateicons/react/lucide";

import AdminLayout from "../layout/AdminLayout";
import EvaluationCard from "../components/EvaluationCard";
import EvaluationFormModal from "../components/EvaluationFormModal";
import Skeleton from "../components/ui/Skeleton";

import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useEvaluations } from "../hooks/useEvaluations";

import type { Evaluation } from "../types/evaluation";
import type { Expedient } from "../types/expedient";

function EvaluationCardSkeleton() {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />

        <div className="mt-6 grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>

        <Skeleton className="mt-6 h-16 w-full" />
        </div>
    );
    }

    function AdminEvaluationsPage() {
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

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [evaluationToDelete, setEvaluationToDelete] =
        useState<Evaluation | null>(null);

    useEffect(() => {
        void fetchEvaluations();

        const loadExpedients = async () => {
        try {
            setLoadingExpedients(true);

            const data = await expedientService.getExpedients(0, 100);
            console.log("EXPEDIENTES:", data);
            console.log("EVALUACIONES:", evaluations);
            setExpedients(data.content);
        } catch {
            notify.error("No se pudieron cargar los expedientes");
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
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!evaluationToDelete) return;

        try {
        await evaluationService.delete(evaluationToDelete.id);

        setDeleteModalOpen(false);
        setEvaluationToDelete(null);

        await fetchEvaluations();

        notify.success("Evaluación eliminada correctamente");
        } catch {
        notify.error("No se pudo eliminar la evaluación");
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
                <h1 className="font-heading text-3xl font-bold text-heading">
                    Evaluaciones
                </h1>

                <p className="mt-2 font-body text-body-text">
                    Registra, consulta y administra el progreso de los niños.
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
                    aria-label="Registrar evaluación"
                    title="Registrar evaluación"
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
                    placeholder="Buscar evaluación..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Buscar evaluación"
                    className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                    />
                </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <EvaluationCardSkeleton />
                <EvaluationCardSkeleton />
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
                    No hay evaluaciones registradas.
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
                    No se encontraron evaluaciones con esa búsqueda.
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
            {deleteModalOpen && evaluationToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]">
                <div className="w-full max-w-[430px] rounded-[20px] bg-white p-[28px] shadow-lg">
                <h2 className="m-0 font-heading text-[24px] font-bold text-heading">
                    Eliminar evaluación
                </h2>

                <p className="mt-[12px] font-body text-body-sm text-neutral-600">
                    ¿Estás seguro de que deseas eliminar la evaluación
                    {deletingExpedient && (
                    <>
                        {" "}de{" "}
                        <span className="font-semibold">
                        {deletingExpedient.childName}
                        </span>
                    </>
                    )}
                    ?
                </p>

                <div className="mt-[28px] flex justify-end gap-[12px]">
                    <button
                    type="button"
                    onClick={() => {
                        setDeleteModalOpen(false);
                        setEvaluationToDelete(null);
                    }}
                    className="rounded-full border border-neutral-300 px-[18px] py-[9px] font-body text-body-sm font-semibold text-heading transition-colors hover:bg-neutral-50"
                    >
                    Cancelar
                    </button>

                    <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    className="rounded-full bg-red-500 px-[18px] py-[9px] font-body text-body-sm font-semibold text-white transition-colors hover:bg-red-600"
                    >
                    Eliminar
                    </button>
                </div>
                </div>
            </div>
            )}
        </AdminLayout>
    );
}

export default AdminEvaluationsPage;