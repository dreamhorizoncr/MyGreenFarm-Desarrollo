import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { XIcon } from "@animateicons/react/lucide";

import Select from "./ui/Select.tsx";
import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useModalVisibility } from "../hooks/useModalExit.ts";
import { validateRequired } from "../utils/validators.ts";

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
    const { t } = useTranslation();
    const [form, setForm] = useState<EvaluationRequest>(emptyForm);
    const [expedients, setExpedients] = useState<Expedient[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof EvaluationRequest, string | null>>
    >({});

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
            setError(t("admin.evaluations.loadExpedientsError"));
        } finally {
            setLoadingOptions(false);
        }
        };

        void loadExpedients();
    }, [isOpen, t]);

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
        setFieldErrors({});
    }, [evaluation, isOpen]);

    const handleChange = (
        field: keyof EvaluationRequest,
        value: string,
    ) => {
        setForm((current) => ({
        ...current,
        [field]: value,
        }));
        setFieldErrors((current) => {
        if (!current[field]) return current;
        return { ...current, [field]: null };
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const errors: Partial<Record<keyof EvaluationRequest, string | null>> = {
            expedientId: validateRequired(form.expedientId, t("admin.evaluations.formChildLabel"), t),
            evaluationDate: validateRequired(form.evaluationDate, t("admin.evaluations.formDateLabel"), t),
            communicationProgress: validateRequired(form.communicationProgress, t("admin.evaluations.formCommunicationLabel"), t),
            languageProgress: validateRequired(form.languageProgress, t("admin.evaluations.formLanguageLabel"), t),
            readingProgress: validateRequired(form.readingProgress, t("admin.evaluations.formReadingLabel"), t),
            motorProgress: validateRequired(form.motorProgress, t("admin.evaluations.formMotorLabel"), t),
            teacherObservation: validateRequired(form.teacherObservation, t("admin.evaluations.formObservationLabel"), t),
        };

        setFieldErrors(errors);

        if (Object.values(errors).some((message) => message !== null)) return;

        try {
        setSaving(true);
        setError(null);

        if (evaluation) {
            await evaluationService.update(evaluation.id, form);
            notify.success(t("admin.evaluations.formUpdateSuccess"));
        } else {
            await evaluationService.create(form);
            notify.success(t("admin.evaluations.formCreateSuccess"));
        }

        onSaved();
        onClose();
        } catch {
        setError(
            evaluation
            ? t("admin.evaluations.formUpdateError")
            : t("admin.evaluations.formCreateError"),
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
            aria-label={t("admin.evaluations.formCloseAriaLabel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={onClose}
        />

        <form
            onSubmit={handleSubmit}
            className={`relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
            <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {evaluation ? t("admin.evaluations.formEditTitle") : t("admin.evaluations.registerEvaluation")}
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
                {t("admin.evaluations.formChildLabel")}
                <div className="mt-xs">
                <Select
                    value={form.expedientId}
                    onChange={(value) => handleChange("expedientId", value)}
                    disabled={loadingOptions}
                    placeholder={loadingOptions ? t("admin.evaluations.formChildLoadingPlaceholder") : t("admin.evaluations.formChildPlaceholder")}
                    options={expedients.map((expedient) => ({
                        value: expedient.id,
                        label: `${expedient.childName} — ${expedient.studentId}`,
                    }))}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                    aria-label={t("admin.evaluations.formChildLabel")}
                />
                </div>
                {fieldErrors.expedientId && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.expedientId}</span>
                )}
            </label>

            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formDateLabel")}
                <input
                type="date"
                value={form.evaluationDate}
                onChange={(event) =>
                    handleChange("evaluationDate", event.target.value)
                }
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.evaluationDate && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.evaluationDate}</span>
                )}
            </label>

            {/* Áreas de progreso */}
            <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("admin.evaluations.formProgressTitle")}
                <p className="mt-2xs font-normal text-neutral-500">
                {t("admin.evaluations.formProgressHint")}
                </p>
            </div>

            {/* Comunicación */}
            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formCommunicationLabel")}
                <textarea
                value={form.communicationProgress}
                onChange={(event) =>
                    handleChange(
                        "communicationProgress",
                        event.target.value,
                    )
                }
                maxLength={2000}
                rows={5}
                placeholder={t("admin.evaluations.formCommunicationPlaceholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.communicationProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.communicationProgress}</span>
                )}
            </label>

            {/* Lenguaje */}
            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formLanguageLabel")}
                <textarea
                value={form.languageProgress}
                onChange={(event) =>
                    handleChange("languageProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("admin.evaluations.formLanguagePlaceholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.languageProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.languageProgress}</span>
                )}
            </label>

            {/* Lectura */}
            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formReadingLabel")}
                <textarea
                value={form.readingProgress}
                onChange={(event) =>
                    handleChange("readingProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("admin.evaluations.formReadingPlaceholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.readingProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.readingProgress}</span>
                )}
            </label>

            {/* Desarrollo motor */}
            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formMotorLabel")}
                <textarea
                value={form.motorProgress}
                onChange={(event) =>
                    handleChange("motorProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("admin.evaluations.formMotorPlaceholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.motorProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.motorProgress}</span>
                )}
            </label>

            {/* Observación */}
            <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("admin.evaluations.formObservationLabel")}
                <textarea
                value={form.teacherObservation}
                onChange={(event) =>
                    handleChange("teacherObservation", event.target.value)
                }
                maxLength={3000}
                rows={5}
                placeholder={t("admin.evaluations.formObservationPlaceholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                {fieldErrors.teacherObservation && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.teacherObservation}</span>
                )}
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
                {t("admin.evaluations.formCancel")}
            </button>

            <button
                type="submit"
                disabled={saving || loadingOptions}
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving
                ? t("admin.evaluations.formSaving")
                : evaluation
                ? t("admin.evaluations.formSaveChanges")
                : t("admin.evaluations.formAdd")}
            </button>
            </div>
        </form>
        </div>
    );
}

export default EvaluationFormModal;
