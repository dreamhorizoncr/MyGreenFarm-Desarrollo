import { useEffect, useState, type FormEvent } from "react";
import { XIcon } from "@animateicons/react/lucide";

import Select from "./ui/Select.tsx";
import { childService } from "../services/child";
import { parentService } from "../services/parent";
import { clubService } from "../services/clubs";
import { notify } from "../utils/notifications.ts";

import type { Child, ChildRequest, Relationship } from "../types/child";
import type { Parent } from "../types/parent";
import type { ClubResponse } from "../types/clubs";
import { useTranslation } from "react-i18next";

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
    };

    const relationshipOptions: {
    value: Relationship;
    label: string;
    }[] = [
    { value: "FATHER", label: "Padre" },
    { value: "MOTHER", label: "Madre" },
    { value: "GRANDFATHER", label: "Abuelo" },
    { value: "GRANDMOTHER", label: "Abuela" },
    { value: "LEGAL_GUARDIAN", label: "Tutor legal" },
    { value: "OTHER", label: "Otro" },
    ];

    function ChildFormModal({
    isOpen,
    child,
    onClose,
    onSaved,
    }: ChildFormModalProps) {

    const { t } = useTranslation();

    const [form, setForm] = useState<ChildRequest>(emptyForm);
    const [parents, setParents] = useState<Parent[]>([]);
    const [clubs, setClubs] = useState<ClubResponse[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadOptions = async () => {
        try {
            setLoadingOptions(true);
            setError(null);

            const [parentsData, clubsData] = await Promise.all([
            parentService.getParents(),
            clubService.getAll({ size: 50 }),
            ]);

            setParents(parentsData.content);
            setClubs(clubsData.content);
        } catch {
            setError("No se pudieron cargar los padres o clubes.");
        } finally {
            setLoadingOptions(false);
        }
        };

        void loadOptions();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (child) {
        const selectedClubIds = clubs
            .filter((club) => child.clubNames.includes(club.name))
            .map((club) => club.id);

        setForm({
            parentIdentification: child.parentIdentification,
            relationship: child.relationship,
            firstName: child.firstName,
            lastName: child.lastName,
            birthDate: child.birthDate,
            medicalNotes: child.medicalNotes ?? "",
            clubIds: selectedClubIds,
        });
        } else {
        setForm(emptyForm);
        }

        setError(null);
    }, [child, isOpen, clubs]);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-[16px] md:p-[30px]">
        <button
            type="button"
            tabIndex={-1}
            aria-label={t("admin.children.cancel")}
            className="absolute inset-0 size-full cursor-default"
            onClick={onClose}
        />

        <form
            onSubmit={handleSubmit}
            className="relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl"
        >
            <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {child
                ? `${t("admin.children.editTitle")}`
                : `${t("admin.children.createTitle")}`}
            </h2>

            <button
                type="button"
                onClick={onClose}
                aria-label={t("admin.children.cancel")}
                className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
            >
                <XIcon size={20} />
            </button>
            </div>

            {error && (
            <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
                {error}
            </p>
            )}

            {loadingOptions ? (
            <p className="mt-lg font-body text-body-sm text-neutral-500">
                {t("admin.children.loadingOptions")}
            </p>
            ) : (
            <div className="mt-lg grid gap-md md:grid-cols-2">
                <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.children.firstName")}
                <input
                    required
                    maxLength={100}
                    value={form.firstName}
                    onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                    }
                    placeholder={t("admin.children.firstNamePlaceholder")}
                    className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
                </label>

                <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.children.lastName")}
                <input
                    required
                    maxLength={100}
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder={t("admin.children.lastNamePlaceholder")}
                    className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
                </label>

                <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.children.parent")}
                <div className="mt-xs">
                    <Select
                        value={form.parentIdentification}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                parentIdentification: value,
                            })
                        }
                        options={parents.map((parent) => ({
                            value: parent.identification,
                            label: `${parent.firstName} ${parent.lastName}`,
                        }))}
                        placeholder={t("admin.children.selectParent")}
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                        aria-label={t("admin.children.parent")}
                    />
                </div>
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
                </div>
                </label>

                <label className="font-body text-body-sm font-semibold text-heading">
                {t("admin.children.birthDate")}
                <input
                    type="date"
                    value={form.birthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                    setForm({ ...form, birthDate: e.target.value })
                    }
                    className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                />
                </label>

                <div className="font-body text-body-sm font-semibold text-heading">
                {t("admin.children.clubs")}
                <div className="mt-xs rounded-xl border border-neutral-200 p-md">
                    {clubs.length === 0 ? (
                    <p className="font-normal text-neutral-500">
                        {t("admin.children.noClubs")}
                    </p>
                    ) : (
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
                    )}
                </div>
                </div>

                <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t("admin.children.medicalNotes")}
                <textarea
                    rows={4}
                    value={form.medicalNotes}
                    onChange={(e) =>
                    setForm({ ...form, medicalNotes: e.target.value })
                    }
                    placeholder={t("admin.children.medicalNotesPlaceholder")}
                    className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                />
                </label>
            </div>
            )}

            <div className="mt-lg flex flex-wrap justify-end gap-sm">
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
                disabled={saving || loadingOptions}
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving
                ? t("admin.children.saving")
                : child
                    ? t("admin.children.saveChanges")
                    : t("admin.children.register")}
            </button>
            </div>
        </form>
        </div>
    );
}

export default ChildFormModal;
