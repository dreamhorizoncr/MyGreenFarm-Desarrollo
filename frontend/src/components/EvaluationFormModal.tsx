import { useEffect, useState, type FormEvent } from "react";
import { XIcon } from "@animateicons/react/lucide";

import Select from "./ui/Select.tsx";
import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";

    import type {
    Evaluation,
    EvaluationRequest,
    } from "../types/evaluation";
    import type { Expedient } from "../types/expedient";

    interface EvaluationFormModalProps {
    isOpen: boolean;
    evaluation?: Evaluation | null;
    onClose: () => void;
    onSaved: () => void;
    }

    const emptyForm: EvaluationRequest = {
    expedientId: "",
    evaluationDate: "",
    communicationProgress: "",
    languageProgress: "",
    readingProgress: "",
    motorProgress: "",
    teacherObservation: "",
    };

    function EvaluationFormModal({
    isOpen,
    evaluation,
    onClose,
    onSaved,
    }: EvaluationFormModalProps) {
    const [form, setForm] = useState<EvaluationRequest>(emptyForm);
    const [expedients, setExpedients] = useState<Expedient[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar expedientes cuando se abre el modal
    useEffect(() => {
        if (!isOpen) return;

        const loadExpedients = async () => {
        try {
            setLoadingOptions(true);
            setError(null);

            const data = await expedientService.getExpedients(0, 100);

            setExpedients(data.content);
        } catch {
            setError("No se pudieron cargar los expedientes.");
        } finally {
            setLoadingOptions(false);
        }
        };

        void loadExpedients();
    }, [isOpen]);

    // Preparar formulario para crear o editar
    useEffect(() => {
        if (!isOpen) return;

        if (evaluation) {
        setForm({
            expedientId: evaluation.expedientId,
            evaluationDate: evaluation.evaluationDate,
            communicationProgress: evaluation.communicationProgress,
            languageProgress: evaluation.languageProgress,
            readingProgress: evaluation.readingProgress,
            motorProgress: evaluation.motorProgress,
            teacherObservation: evaluation.teacherObservation,
        });
        } else {
        setForm(emptyForm);
        }

        setError(null);
    }, [evaluation, isOpen]);

    const handleChange = (
        field: keyof EvaluationRequest,
        value: string,
    ) => {
        setForm((current) => ({
        ...current,
        [field]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
        setSaving(true);
        setError(null);

        if (evaluation) {
            await evaluationService.update(evaluation.id, form);
            notify.success("Evaluación actualizada correctamente");
        } else {
            await evaluationService.create(form);
            notify.success("Evaluación registrada correctamente");
        }

        onSaved();
        onClose();
        } catch {
        setError(
            evaluation
            ? "No se pudo actualizar la evaluación."
            : "No se pudo registrar la evaluación.",
        );
        } finally {
        setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px] py-[30px]">
        <div className="max-h-[90vh] w-full max-w-[820px] overflow-y-auto rounded-[20px] bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 px-[28px] py-[22px]">
            <div>
                <h2 className="m-0 font-heading text-[26px] font-bold text-heading">
                {evaluation ? "Editar evaluación" : "Registrar evaluación"}
                </h2>

                <p className="mt-[5px] font-body text-body-sm text-neutral-500">
                Registra el progreso y las observaciones del niño.
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
                aria-label="Cerrar"
            >
                <XIcon size={20} />
            </button>
            </div>

            <form onSubmit={handleSubmit} className="p-[28px]">
            {error && (
                <div className="mb-[20px] rounded-[12px] border border-red-200 bg-red-50 p-[14px] font-body text-body-sm text-red-600">
                {error}
                </div>
            )}

            {/* Expediente + fecha */}
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2">
                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Niño / Expediente
                </label>

                <Select
                    value={form.expedientId}
                    onChange={(value) => handleChange("expedientId", value)}
                    disabled={loadingOptions}
                    placeholder={loadingOptions ? "Cargando expedientes..." : "Seleccione un niño"}
                    options={expedients.map((expedient) => ({
                        value: expedient.id,
                        label: `${expedient.childName} — ${expedient.studentId}`,
                    }))}
                    className="h-11 w-full rounded-[12px] border border-neutral-300 bg-white px-[14px]"
                    aria-label="Niño / Expediente"
                />
                </div>

                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Fecha de evaluación
                </label>

                <input
                    type="date"
                    value={form.evaluationDate}
                    onChange={(event) =>
                    handleChange("evaluationDate", event.target.value)
                    }
                    required
                    className="w-full rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[10px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
                </div>
            </div>

            {/* Áreas de progreso */}
            <div className="mt-[26px]">
                <h3 className="m-0 font-heading text-[20px] font-bold text-heading">
                Áreas de progreso
                </h3>

                <p className="mt-[4px] font-body text-body-sm text-neutral-500">
                Describe el avance observado en cada área.
                </p>
            </div>

            <div className="mt-[18px] grid grid-cols-1 gap-[20px] md:grid-cols-2">
                {/* Comunicación */}
                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Comunicación
                </label>

                <textarea
                    value={form.communicationProgress}
                    onChange={(event) =>
                    handleChange(
                        "communicationProgress",
                        event.target.value,
                    )
                    }
                    required
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe el progreso en comunicación..."
                    className="w-full resize-none rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[11px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
                </div>

                {/* Lenguaje */}
                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Lenguaje
                </label>

                <textarea
                    value={form.languageProgress}
                    onChange={(event) =>
                    handleChange("languageProgress", event.target.value)
                    }
                    required
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe el progreso en lenguaje..."
                    className="w-full resize-none rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[11px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
                </div>

                {/* Lectura */}
                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Lectura
                </label>

                <textarea
                    value={form.readingProgress}
                    onChange={(event) =>
                    handleChange("readingProgress", event.target.value)
                    }
                    required
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe el progreso en lectura..."
                    className="w-full resize-none rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[11px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
                </div>

                {/* Desarrollo motor */}
                <div>
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                    Desarrollo motor
                </label>

                <textarea
                    value={form.motorProgress}
                    onChange={(event) =>
                    handleChange("motorProgress", event.target.value)
                    }
                    required
                    maxLength={2000}
                    rows={5}
                    placeholder="Describe el progreso motor..."
                    className="w-full resize-none rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[11px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
                </div>
            </div>

            {/* Observación */}
            <div className="mt-[20px]">
                <label className="mb-[7px] block font-body text-body-sm font-semibold text-green-700">
                Observación del profesor
                </label>

                <textarea
                value={form.teacherObservation}
                onChange={(event) =>
                    handleChange("teacherObservation", event.target.value)
                }
                required
                maxLength={3000}
                rows={5}
                placeholder="Agrega observaciones generales sobre el desempeño del niño..."
                className="w-full resize-none rounded-[12px] border border-neutral-300 bg-white px-[14px] py-[11px] font-body text-body-sm text-heading outline-none transition-colors focus:border-green-500"
                />
            </div>

            {/* Botones */}
            <div className="mt-[28px] flex justify-end gap-[12px] border-t border-neutral-100 pt-[22px]">
                <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-green-600 bg-white px-[22px] py-[10px] font-body text-body-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                >
                Cancelar
                </button>

                <button
                type="submit"
                disabled={saving || loadingOptions}
                className="rounded-full bg-orange-500 px-[22px] py-[10px] font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {saving
                    ? "Guardando..."
                    : evaluation
                    ? "Guardar cambios"
                    : "Registrar evaluación"}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
}

export default EvaluationFormModal;