
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import Select from './ui/Select.tsx'
import ModalCloseButton from './ui/ModalCloseButton.tsx'

import { adminService } from '../services/admin.ts'
import { groupService } from '../services/group.ts'

import { notify, notifyError } from '../utils/notifications.ts'
import { getErrorField, getErrorMessage } from '../utils/error.ts'
import { validateRequired, validateSafeText } from '../utils/validators.ts'
import { useModalVisibility } from '../hooks/useModalExit.ts'

import type { UserInfo } from '../types/auth.ts'
import type { Group, GroupRequest } from '../types/group.ts'

interface GroupFormModalProps {
    isOpen: boolean
    group?: Group | null
    onClose: () => void
    onSaved: () => void
}

const emptyForm: GroupRequest = {
    name: '',
    description: '',
    maxCapacity: null,
    teacherIds: [],
}

function GroupFormModal({
    isOpen,
    group,
    onClose,
    onSaved,
}: Readonly<GroupFormModalProps>) {
    const { t } = useTranslation()

    const [form, setForm] = useState<GroupRequest>(emptyForm)
    const [teachers, setTeachers] = useState<UserInfo[]>([])
    const [loadingTeachers, setLoadingTeachers] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<
        Record<string, string | null>
    >({})

    const { shouldRender, closing } = useModalVisibility(isOpen)

    const clearFieldError = (field: string) => {
        setFieldErrors((current) => ({
            ...current,
            [field]: null,
        }))
    }

    useEffect(() => {
        if (!isOpen) return

        let mounted = true

        setForm(
            group
                ? {
                    name: group.name,
                    description: group.description ?? '',
                    maxCapacity: group.maxCapacity,
                    teacherIds: group.teacherIds ?? [],
                }
                : { ...emptyForm },
        )

        setError(null)
        setFieldErrors({})

        const loadTeachers = async () => {
            try {
                setLoadingTeachers(true)

                const data = await adminService.getTeachers()

                if (mounted) {
                    setTeachers(data)
                }
            } catch {
                if (mounted) {
                    setError(t('admin.groups.loadError'))
                }
            } finally {
                if (mounted) {
                    setLoadingTeachers(false)
                }
            }
        }

        void loadTeachers()

        return () => {
            mounted = false
        }
    }, [isOpen, group, t])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (saving) return

        const errors: Record<string, string | null> = {
            name:
                validateRequired(form.name, t('admin.groups.name'), t) ??
                validateSafeText(form.name, t),

            description: validateSafeText(form.description ?? '', t),

            teacherIds:
                form.teacherIds.length === 0
                    ? t('admin.groups.requiredField')
                    : null,

            maxCapacity:
                form.maxCapacity !== null &&
                    (!Number.isInteger(form.maxCapacity) || form.maxCapacity < 1)
                    ? t('admin.groups.invalidCapacity')
                    : null,
        }

        setFieldErrors(errors)

        if (Object.values(errors).some((message) => message !== null)) {
            return
        }

        try {
            setSaving(true)

            const payload: GroupRequest = {
                name: form.name.trim(),
                description: form.description?.trim() || null,
                maxCapacity: form.maxCapacity,
                teacherIds: form.teacherIds,
            }

            if (group) {
                await groupService.update(group.id, payload)
            } else {
                await groupService.create(payload)
            }

            notify.success(
                t(
                    group
                        ? 'admin.groups.updateSuccess'
                        : 'admin.groups.createSuccess',
                ),
            )

            onSaved()
            onClose()
        } catch (err) {
            const field = getErrorField(err)

            if (field) {
                setFieldErrors((current) => ({
                    ...current,
                    [field]: getErrorMessage(err),
                }))
            }

            notifyError(
                t(
                    group
                        ? 'admin.groups.updateError'
                        : 'admin.groups.createError',
                ),
                err,
            )
        } finally {
            setSaving(false)
        }
    }

    if (!shouldRender) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 text-left md:p-[30px]">
            {/* Backdrop */}
            <button
                type="button"
                tabIndex={-1}
                aria-label={t('admin.groups.cancel')}
                className="absolute inset-0 size-full cursor-default"
                onClick={onClose}
            />

            {/* Modal */}
            <form
                onSubmit={handleSubmit}
                role="dialog"
                aria-modal="true"
                aria-label={t(
                    group
                        ? 'admin.groups.editTitle'
                        : 'admin.groups.createTitle',
                )}
                className={`modal-scroll relative mx-auto max-h-full w-full max-w-[820px] overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing
                    ? 'animate-[modal-out_0.32s_ease-in]'
                    : 'animate-[modal-in_0.32s_ease-out]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-md">
                    <h2 className="m-0 font-heading text-h4 font-bold text-heading">
                        {t(
                            group
                                ? 'admin.groups.editTitle'
                                : 'admin.groups.createTitle',
                        )}
                    </h2>

                    <ModalCloseButton
                        onClick={onClose}
                        aria-label={t('admin.groups.cancel')}
                    />
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700"
                    >
                        {error}
                    </p>
                )}

                {/* Fields */}
                <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
                    {/* Name */}
                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t('admin.groups.name')}

                        <input
                            type="text"
                            maxLength={100}
                            required
                            value={form.name}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                                clearFieldError('name')
                            }}
                            placeholder={t('admin.groups.namePlaceholder')}
                            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                        />

                        {fieldErrors.name && (
                            <span className="mt-xs block font-normal text-danger">
                                {fieldErrors.name}
                            </span>
                        )}
                    </label>

                    {/* Teacher */}
                    <div className="font-body text-body-sm font-semibold text-heading">
                        <label id="group-teacher-label">
                            {t('admin.groups.teacher')}
                        </label>

                        <div className="mt-xs">
                            <Select
                                value={form.teacherIds[0] ?? ''}
                                onChange={(value) => {
                                    setForm((current) => ({
                                        ...current,
                                        teacherIds: value ? [value] : [],
                                    }))
                                    clearFieldError('teacherIds')
                                }}
                                options={teachers.map((teacher) => ({
                                    value: teacher.id,
                                    label: `${teacher.firstName} ${teacher.lastName}`,
                                }))}
                                placeholder={
                                    loadingTeachers
                                        ? t('admin.children.loadingOptions')
                                        : t('admin.groups.selectTeacher')
                                }
                                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                                aria-label={t('admin.groups.teacher')}
                            />
                        </div>

                        {fieldErrors.teacherIds && (
                            <span className="mt-xs block font-normal text-danger">
                                {fieldErrors.teacherIds}
                            </span>
                        )}
                    </div>

                    {/* Capacity */}
                    <label className="font-body text-body-sm font-semibold text-heading">
                        {t('admin.groups.capacity')}

                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={form.maxCapacity ?? ''}
                            onChange={(event) => {
                                const value = event.target.value

                                setForm((current) => ({
                                    ...current,
                                    maxCapacity:
                                        value === '' ? null : Number(value),
                                }))

                                clearFieldError('maxCapacity')
                            }}
                            placeholder={t('admin.groups.capacityPlaceholder')}
                            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                        />

                        <span className="mt-xs block font-body text-caption font-normal text-neutral-500">
                            {t('admin.groups.unlimitedCapacity')}
                        </span>

                        {fieldErrors.maxCapacity && (
                            <span className="mt-xs block font-normal text-danger">
                                {fieldErrors.maxCapacity}
                            </span>
                        )}
                    </label>

                    {/* Description */}
                    <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                        {t('admin.groups.descriptionLabel')}

                        <textarea
                            rows={4}
                            maxLength={1000}
                            value={form.description ?? ''}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                                clearFieldError('description')
                            }}
                            placeholder={t('admin.groups.descriptionPlaceholder')}
                            className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                        />

                        {fieldErrors.description && (
                            <span className="mt-xs block font-normal text-danger">
                                {fieldErrors.description}
                            </span>
                        )}
                    </label>
                </div>

                {/* Actions */}
                <div className="mt-lg flex flex-col gap-md sm:flex-row sm:justify-end sm:[&>*]:flex-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                        {t('admin.groups.cancel')}
                    </button>

                    <button
                        type="submit"
                        disabled={
                            saving ||
                            loadingTeachers ||
                            !!error ||
                            !form.name.trim() ||
                            form.teacherIds.length === 0
                        }
                        className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t(
                            group
                                ? 'admin.groups.update'
                                : 'admin.groups.create',
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default GroupFormModal
