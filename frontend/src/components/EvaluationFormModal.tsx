import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import Select from "./ui/Select.tsx";
import { evaluationService } from "../services/evaluation";
import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications";
import { useModalVisibility } from "../hooks/useModalExit.ts";
import DatePickerField from "./ui/DatePickerField.tsx";
import { validateRequired, validateSafeText } from "../utils/validators.ts";
import ModalCloseButton from "./ui/ModalCloseButton.tsx";
import FieldHint from "./ui/FieldHint.tsx";

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
}: Readonly<EvaluationFormModalProps>) {
    const { t } = useTranslation();
    const [form, setForm] = useState<EvaluationRequest>(emptyForm);
    const [expedients, setExpedients] = useState<Expedient[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<keyof EvaluationRequest, string | null>>
    >({});

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

        const today = new Date().toISOString().split("T")[0];
        let dateError = validateRequired(form.evaluationDate, t("admin.evaluations.formDateLabel"), t);
        
        if (!dateError && form.evaluationDate > today) {
            dateError = t("admin.evaluations.formDateFutureError", { defaultValue: "La fecha de evaluación no puede ser posterior a hoy." });
        }

        const errors: Partial<Record<keyof EvaluationRequest, string | null>> = {
            expedientId: validateRequired(form.expedientId, t("admin.evaluations.formChildLabel"), t),
            evaluationDate: dateError,
            communicationProgress: validateRequired(form.communicationProgress, t("admin.evaluations.formCommunicationLabel"), t) ?? validateSafeText(form.communicationProgress, t),
            languageProgress: validateRequired(form.languageProgress, t("admin.evaluations.formLanguageLabel"), t) ?? validateSafeText(form.languageProgress, t),
            readingProgress: validateRequired(form.readingProgress, t("admin.evaluations.formReadingLabel"), t) ?? validateSafeText(form.readingProgress, t),
            motorProgress: validateRequired(form.motorProgress, t("admin.evaluations.formMotorLabel"), t) ?? validateSafeText(form.motorProgress, t),
            teacherObservation: validateRequired(form.teacherObservation, t("admin.evaluations.formObservationLabel"), t) ?? validateSafeText(form.teacherObservation, t),
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
        <div className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]">
        <button
            type="button"
            tabIndex={-1}
            aria-label={t("admin.evaluations.formCloseAriaLabel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={onClose}
        />

        <form
            onSubmit={handleSubmit}
            className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
            <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-h4 font-bold text-heading">
                {evaluation ? t("admin.evaluations.formEditTitle") : t("admin.evaluations.registerEvaluation")}
            </h2>

            <ModalCloseButton
                onClick={onClose}
                aria-label={t("common.close")}
            />
            </div>

            {error && (
            <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
                {error}
            </p>
            )}

            <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
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
                <FieldHint>{t("fields.evaluation.child.hint")}</FieldHint>
                </div>
                {fieldErrors.expedientId && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.expedientId}</span>
                )}
            </label>

            <div className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formDateLabel")}
                <DatePickerField
                value={form.evaluationDate}
                onChange={(value) =>
                    handleChange("evaluationDate", value)
                }
                ariaLabel={t("admin.evaluations.formDateLabel")}
                />
                {fieldErrors.evaluationDate && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.evaluationDate}</span>
                )}
            </div>

            <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("admin.evaluations.formProgressTitle")}
                <p className="mt-2xs font-normal text-neutral-500">
                {t("admin.evaluations.formProgressHint")}
                </p>
            </div>

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
                placeholder={t("fields.evaluation.communication.placeholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                <FieldHint>{t("fields.evaluation.communication.hint")}</FieldHint>
                {fieldErrors.communicationProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.communicationProgress}</span>
                )}
            </label>

            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formLanguageLabel")}
                <textarea
                value={form.languageProgress}
                onChange={(event) =>
                    handleChange("languageProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("fields.evaluation.language.placeholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                <FieldHint>{t("fields.evaluation.language.hint")}</FieldHint>
                {fieldErrors.languageProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.languageProgress}</span>
                )}
            </label>

            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formReadingLabel")}
                <textarea
                value={form.readingProgress}
                onChange={(event) =>
                    handleChange("readingProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("fields.evaluation.reading.placeholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                <FieldHint>{t("fields.evaluation.reading.hint")}</FieldHint>
                {fieldErrors.readingProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.readingProgress}</span>
                )}
            </label>

            <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.formMotorLabel")}
                <textarea
                value={form.motorProgress}
                onChange={(event) =>
                    handleChange("motorProgress", event.target.value)
                }
                maxLength={2000}
                rows={5}
                placeholder={t("fields.evaluation.motor.placeholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                <FieldHint>{t("fields.evaluation.motor.hint")}</FieldHint>
                {fieldErrors.motorProgress && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.motorProgress}</span>
                )}
            </label>

            <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("admin.evaluations.formObservationLabel")}
                <textarea
                value={form.teacherObservation}
                onChange={(event) =>
                    handleChange("teacherObservation", event.target.value)
                }
                maxLength={3000}
                rows={5}
                placeholder={t("fields.evaluation.observation.placeholder")}
                className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                <FieldHint>{t("fields.evaluation.observation.hint")}</FieldHint>
                {fieldErrors.teacherObservation && (
                    <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.teacherObservation}</span>
                )}
            </label>
            </div>

            <div className="mt-lg flex justify-end gap-md *:flex-1">
            <button
                type="button"
                tabIndex={-1}
                aria-label={t("admin.evaluations.formCloseAriaLabel")}
                className="absolute inset-0 size-full cursor-default"
                onClick={onClose}
            />

            <form
                onSubmit={handleSubmit}
                className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
            >
                <div className="flex items-center justify-between gap-md">
                    <h2 className="m-0 font-heading text-h4 font-bold text-heading">
                        {evaluation ? t("admin.evaluations.formEditTitle") : t("admin.evaluations.registerEvaluation")}
                    </h2>

                    <ModalCloseButton
                        onClick={onClose}
                        aria-label={t("common.close")}
                    />
                </div>

                {error && (
                    <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-lg grid gap-md md:grid-cols-2">
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

                    <div className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.evaluations.formDateLabel")}
                        <DatePickerField
                            value={form.evaluationDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(value) =>
                                handleChange("evaluationDate", value)
                            }
                            ariaLabel={t("admin.evaluations.formDateLabel")}
                        />
                        {fieldErrors.evaluationDate && (
                            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.evaluationDate}</span>
                        )}
                    </div>

                    <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                        {t("admin.evaluations.formProgressTitle")}
                        <p className="mt-2xs font-normal text-neutral-500">
                            {t("admin.evaluations.formProgressHint")}
                        </p>
                    </div>

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