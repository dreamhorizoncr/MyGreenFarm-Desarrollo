import { useEffect, useState, type FormEvent } from "react";

import Select from "./ui/Select.tsx";
import { childService } from "../services/child";
import { parentService } from "../services/parent";
import { clubService } from "../services/clubs";
import { notify } from "../utils/notifications.ts";
import { useModalVisibility } from "../hooks/useModalExit.ts";
import DatePickerField from "./ui/DatePickerField.tsx";

import type { Child, ChildRequest, Relationship } from "../types/child";
import type { Parent } from "../types/parent";
import type { ClubResponse } from "../types/clubs";
import { useTranslation } from "react-i18next";
import { validateRequired, validateSafeText } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import ModalCloseButton from "./ui/ModalCloseButton.tsx";
import FieldHint from "./ui/FieldHint.tsx";

interface ChildFormModalProps {
    isOpen: boolean;
    child?: Child | null;
    onClose: () => void;
    onSaved: () => void;
}

const emptyForm: ChildRequest = {
    parentIdentification: "",
    relationship: "FATHER",
    firstName: "",
    lastName: "",
    birthDate: "",
    medicalNotes: "",
    clubIds: [],
    isActive: true, 
};

function ChildFormModal({
    isOpen,
    child,
    onClose,
    onSaved,
}: Readonly<ChildFormModalProps>) {
    const { t } = useTranslation();

    const relationshipOptions: {
        value: Relationship;
        label: string;
    }[] = [
        { value: "FATHER", label: t("admin.children.relationships.father") },
        { value: "MOTHER", label: t("admin.children.relationships.mother") },
        { value: "GRANDFATHER", label: t("admin.children.relationships.grandfather") },
        { value: "GRANDMOTHER", label: t("admin.children.relationships.grandmother") },
        { value: "LEGAL_GUARDIAN", label: t("admin.children.relationships.legalGuardian") },
        { value: "OTHER", label: t("admin.children.relationships.other") },
    ];

    const [form, setForm] = useState<ChildRequest>(emptyForm);
    const [parents, setParents] = useState<Parent[]>([]);
    const [clubs, setClubs] = useState<ClubResponse[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

    const clearFieldError = (field: string) => {
        setFieldErrors((current) => {
            if (!current[field]) return current;
            return { ...current, [field]: null };
        });
    };

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        if (child) {
            setForm({
                parentIdentification: child.parentIdentification ?? "",
                relationship: child.relationship ?? "FATHER",
                firstName: child.firstName ?? "",
                lastName: child.lastName ?? "",
                birthDate: child.birthDate ?? "",
                medicalNotes: child.medicalNotes ?? "",
                clubIds: [],
                isActive: child.isActive ?? true,
            });
        } else {
            setForm(emptyForm);
        }

        setError(null);

        const loadOptions = async () => {
            try {
                if (isMounted) setLoadingOptions(true);

                const languageCode = (i18n.resolvedLanguage ?? i18n.language ?? "es").split("-")[0];

                const [parentsData, availableClubsList] = await Promise.all([
                    parentService.getParents(),
                    clubService.getAvailableClubs(languageCode),
                ]);

                if (!isMounted) return;

                const loadedParents = parentsData.content ?? [];
                const loadedClubs = availableClubsList ?? [];

                setParents(loadedParents);
                setClubs(loadedClubs);

                if (child?.clubNames) {
                    const selectedIds = loadedClubs
                        .filter((club) => child.clubNames.includes(club.name))
                        .map((club) => club.id);

                    setForm((prev) => ({ ...prev, clubIds: selectedIds }));
                }
            } catch {
                if (isMounted) setError(t("admin.children.optionsError"));
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        void loadOptions();

        return () => {
            isMounted = false;
        };
    }, [isOpen, child]);

    const handleClubChange = (clubId: number) => {
        setForm((current) => ({
            ...current,
            clubIds: current.clubIds.includes(clubId)
                ? current.clubIds.filter((id) => id !== clubId)
                : [...current.clubIds, clubId],
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const errors: Record<string, string | null> = {
            firstName: validateRequired(form.firstName, t("admin.children.firstName"), t) ?? validateSafeText(form.firstName, t),
            lastName: validateRequired(form.lastName, t("admin.children.lastName"), t) ?? validateSafeText(form.lastName, t),
            parentIdentification: validateRequired(form.parentIdentification, t("admin.children.parent"), t),
            medicalNotes: validateSafeText(form.medicalNotes, t),
        };

        setFieldErrors(errors);

        if (Object.values(errors).some((message) => message !== null)) return;

        try {
            setSaving(true);
            setError(null);

            if (child) {
                await childService.update(child.id, form);
            } else {
                await childService.create(form);
            }

            notify.success(
                child
                    ? t("admin.children.updateSuccessToastTitle")
                    : t("admin.children.createSuccessToastTitle"),
            );

            onSaved();
            onClose();
        } catch {
            const errorMessage = child
                ? t("admin.children.updateError")
                : t("admin.children.createError");

            setError(errorMessage);

            notify.error({
                title: child
                    ? t("admin.children.updateErrorToastTitle")
                    : t("admin.children.createErrorToastTitle"),
                description: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    const { shouldRender, closing } = useModalVisibility(isOpen);
    if (!shouldRender) return null;

    let submitLabel = t("admin.children.register");
    if (saving) submitLabel = t("admin.children.saving");
    else if (child) submitLabel = t("admin.children.saveChanges");

    const renderClubs = () => {
        if (loadingOptions) {
            return (
                <p className="font-normal text-neutral-400 animate-pulse">
                    {t("admin.children.loadingOptions")}
                </p>
            );
        }
        if (clubs.length === 0) {
            return (
                <p className="font-normal text-neutral-500">
                    {t("admin.children.noClubs")}
                </p>
            );
        }
        return (
            <div className="flex flex-col gap-3">
                {clubs.map((club) => (
                    <label
                        key={club.id}
                        className="flex cursor-pointer items-center gap-2 font-normal text-body-text"
                    >
                        <input
                            type="checkbox"
                            checked={form.clubIds.includes(club.id)}
                            onChange={() => handleClubChange(club.id)}
                            className="size-4 accent-green-500"
                        />
                        {club.name}
                    </label>
                ))}
            </div>
        );
    };

    return (
        <div className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]">
            <button
                type="button"
                tabIndex={-1}
                aria-label={t("admin.children.cancel")}
                className="absolute inset-0 size-full cursor-default"
                onClick={onClose}
            />

            <form
                onSubmit={handleSubmit}
                className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
            >
                <div className="flex items-center justify-between gap-md">
                    <h2 className="m-0 font-heading text-h4 font-bold text-heading">
                        {child
                            ? `${t("admin.children.editTitle")}`
                            : `${t("admin.children.createTitle")}`}
                    </h2>

                    <ModalCloseButton
                        onClick={onClose}
                        aria-label={t("admin.children.cancel")}
                    />
                </div>

                {error && (
                    <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.firstName")}
                        <input
                            maxLength={100}
                            value={form.firstName}
                            onChange={(e) => {
                                setForm({ ...form, firstName: e.target.value });
                                clearFieldError("firstName");
                            }}
                            placeholder={t("fields.child.firstName.placeholder")}
                            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                        />
                        <FieldHint>{t("fields.child.firstName.hint")}</FieldHint>
                        {fieldErrors.firstName && (
                            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.firstName}</span>
                        )}
                    </label>

                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.lastName")}
                        <input
                            maxLength={100}
                            value={form.lastName}
                            onChange={(e) => {
                                setForm({ ...form, lastName: e.target.value });
                                clearFieldError("lastName");
                            }}
                            placeholder={t("fields.child.lastName.placeholder")}
                            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                        />
                        <FieldHint>{t("fields.child.lastName.hint")}</FieldHint>
                        {fieldErrors.lastName && (
                            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.lastName}</span>
                        )}
                    </label>

                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.parent")}
                        <div className="mt-xs">
                            <Select
                                value={form.parentIdentification}
                                onChange={(value) => {
                                    setForm({
                                        ...form,
                                        parentIdentification: value,
                                    });
                                    clearFieldError("parentIdentification");
                                }}
                                options={parents.map((parent) => ({
                                    value: parent.identification,
                                    label: `${parent.firstName} ${parent.lastName}`,
                                }))}
                                placeholder={
                                    loadingOptions
                                        ? t("admin.children.loadingOptions")
                                        : t("admin.children.selectParent")
                                }
                                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                                aria-label={t("admin.children.parent")}
                            />
                            <FieldHint>{t("fields.child.parent.hint")}</FieldHint>
                        </div>
                        {fieldErrors.parentIdentification && (
                            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.parentIdentification}</span>
                        )}
                    </label>

                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.relationship")}
                        <div className="mt-xs">
                            <Select
                                value={form.relationship}
                                onChange={(value) =>
                                    setForm({
                                        ...form,
                                        relationship: value as Relationship,
                                    })
                                }
                                options={relationshipOptions}
                                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                                aria-label={t("admin.children.relationship")}
                            />
                            <FieldHint>{t("fields.child.relationship.hint")}</FieldHint>
                        </div>
                    </label>

                    <div className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.birthDate")}
                        <DatePickerField
                            value={form.birthDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(value) =>
                                setForm({ ...form, birthDate: value })
                            }
                            ariaLabel={t("admin.children.birthDate")}
                        />
                        <FieldHint>{t("fields.child.birthDate.hint")}</FieldHint>
                    </div>

                    <div className="font-body text-body-sm font-semibold text-heading">
                        {t("admin.children.clubs")}
                        <div className="mt-xs rounded-xl border border-neutral-200 p-md">
                            {renderClubs()}
                        </div>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-md rounded-xl border border-neutral-200 bg-neutral-50 p-md">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <span className="sr-only">{t("admin.children.isActive", { defaultValue: "Estudiante activo" })}</span>
                            <input
                                type="checkbox"
                                checked={form.isActive ?? true}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                        <div>
                            <span className="block font-body text-body-sm font-semibold text-heading">
                                {t("admin.children.isActive", { defaultValue: "Estudiante activo" })}
                            </span>
                            <span className="text-caption text-neutral-500">
                                {t("admin.children.isActiveDescription")}
                            </span>
                        </div>
                    </div>

                    {/* Notas Médicas */}
                    <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                        {t("admin.children.medicalNotes")}
                        <textarea
                            rows={4}
                            value={form.medicalNotes}
                            onChange={(e) =>
                                setForm({ ...form, medicalNotes: e.target.value })
                            }
                            placeholder={t("fields.child.medicalNotes.placeholder")}
                            className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                        />
                        <FieldHint>{t("fields.child.medicalNotes.hint")}</FieldHint>
                        {fieldErrors.medicalNotes && (
                            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.medicalNotes}</span>
                        )}
                    </label>
                </div>

                <div className="mt-lg flex justify-end gap-md *:flex-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                        {t("admin.children.cancel")}
                    </button>

                    <button
                        type="submit"
                        disabled={saving || !form.firstName.trim() || !form.lastName.trim() || !form.parentIdentification}
                        className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChildFormModal;