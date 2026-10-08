import { useEffect, useState, type FormEvent } from "react";
import { XIcon } from "@animateicons/react/lucide";

import Select from "./ui/Select.tsx";
import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useModalVisibility } from "../hooks/useModalExit.ts";

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

    const { shouldRender, closing } = useModalVisibility(isOpen);
    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
        <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar"
            className="absolute inset-0 size-full cursor-default"
            onClick={onClose}
        />

        <form
            onSubmit={handleSubmit}
            className={`relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
            <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {evaluation ? "Editar evaluación" : "Registrar evaluación"}
            </h2>

            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
            >
                <XIcon size={20} />
            </button>
            </div>

            {error && (
            <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
                {error}
            </p>
            )}

            <div className="mt-lg grid gap-md md:grid-cols-2">
            {/* Expediente + fecha */}
            <label className="font-body text-body-sm font-semibold text-heading">
                Niño / Expediente
                <div className="mt-xs">
                <Select
                    value={form.expedientId}
                    onChange={(value) => handleChange("expedientId", value)}
                    disabled={loadingOptions}
                    placeholder={loadingOptions ? "Cargando expedientes..." : "Seleccione un niño"}
                    options={expedients.map((expedient) => ({
                        value: expedient.id,
                        label: `${expedient.childName} — ${expedient.studentId}`,
                    }))}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                    aria-label="Niño / Expediente"
                />
                </div>
            </label>

            <label className="font-body text-body-sm font-semibold text-heading">
                Fecha de evaluación
                <input
                type="date"
                value={form.evaluationDate}
                onChange={(event) =>
                    handleChange("evaluationDate", event.target.value)
                }
                required
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
            </label>

            {/* Áreas de progreso */}
            <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                Áreas de progreso
                <p className="mt-2xs font-normal text-neutral-500">
                Describe el avance observado en cada área.
                </p>
            </div>

            {/* Comunicación */}
            <label className="font-body text-body-sm font-semibold text-heading">
                Comunicación
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
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
            </label>

            {/* Lenguaje */}
            <label className="font-body text-body-sm font-semibold text-heading">
                Lenguaje
                <textarea
                value={form.languageProgress}
                onChange={(event) =>
                    handleChange("languageProgress", event.target.value)
                }
                required
                maxLength={2000}
                rows={5}
                placeholder="Describe el progreso en lenguaje..."
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
            </label>

            {/* Lectura */}
            <label className="font-body text-body-sm font-semibold text-heading">
                Lectura
                <textarea
                value={form.readingProgress}
                onChange={(event) =>
                    handleChange("readingProgress", event.target.value)
                }
                required
                maxLength={2000}
                rows={5}
                placeholder="Describe el progreso en lectura..."
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
            </label>

            {/* Desarrollo motor */}
            <label className="font-body text-body-sm font-semibold text-heading">
                Desarrollo motor
                <textarea
                value={form.motorProgress}
                onChange={(event) =>
                    handleChange("motorProgress", event.target.value)
                }
                required
                maxLength={2000}
                rows={5}
                placeholder="Describe el progreso motor..."
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
            </label>

            {/* Observación */}
            <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                Observación del profesor
                <textarea
                value={form.teacherObservation}
                onChange={(event) =>
                    handleChange("teacherObservation", event.target.value)
                }
                required
                maxLength={3000}
                rows={5}
                placeholder="Agrega observaciones generales sobre el desempeño del niño..."
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
            </label>
            </div>

            {/* Botones */}
            <div className="mt-lg flex flex-wrap justify-end gap-sm">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 disabled:opacity-50"
            >
                Cancelar
            </button>

            <button
                type="submit"
                disabled={saving || loadingOptions}
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving
                ? "Guardando..."
                : evaluation
                ? "Guardar cambios"
                : "Agregar"}
            </button>
            </div>
        </form>
        </div>
    );
}

export default EvaluationFormModal;
