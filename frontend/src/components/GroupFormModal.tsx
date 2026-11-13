
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

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
    const [teacherMenuOpen, setTeacherMenuOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<
        Record<string, string | null>
    >({})

    const teacherSelectorRef = useRef<HTMLDivElement>(null)

    const { shouldRender, closing } = useModalVisibility(isOpen)

    const selectedTeachers = teachers.filter((teacher) =>
        form.teacherIds.includes(teacher.id),
    )

    const clearFieldError = (field: string) => {
        setFieldErrors((current) => ({
            ...current,
            [field]: null,
        }))
    }

    const toggleTeacher = (teacherId: string) => {
        setForm((current) => {
            const isSelected = current.teacherIds.includes(teacherId)

            return {
                ...current,
                teacherIds: isSelected
                    ? current.teacherIds.filter((id) => id !== teacherId)
                    : [...current.teacherIds, teacherId],
            }
        })

        clearFieldError('teacherIds')
    }

    const removeTeacher = (teacherId: string) => {
        setForm((current) => ({
            ...current,
            teacherIds: current.teacherIds.filter((id) => id !== teacherId),
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

        setTeacherMenuOpen(false)
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

    useEffect(() => {
        if (!teacherMenuOpen) return

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node

            if (!teacherSelectorRef.current?.contains(target)) {
                setTeacherMenuOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setTeacherMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [teacherMenuOpen])

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
                teacherIds: [...form.teacherIds],
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

    let teacherPlaceholder = t('admin.groups.selectTeacher')
    if (loadingTeachers) teacherPlaceholder = t('admin.children.loadingOptions')
    else if (teachers.length === 0) teacherPlaceholder = t('admin.groups.loadError')
    else if (form.teacherIds.length > 0) teacherPlaceholder = t('admin.groups.teachersSelected', { count: form.teacherIds.length })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 text-left md:p-[30px]">
            <button
                type="button"
                tabIndex={-1}
                aria-label={t('admin.groups.cancel')}
                className="absolute inset-0 size-full cursor-default"
                onClick={onClose}
            />

            <dialog
                open
                aria-modal="true"
                aria-label={t(
                    group
                        ? 'admin.groups.editTitle'
                        : 'admin.groups.createTitle',
                )}
                className={`modal-scroll relative mx-auto my-0 max-h-full w-full max-w-[820px] overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg text-inherit shadow-lg md:p-xl ${closing
                    ? 'animate-[modal-out_0.32s_ease-in]'
                    : 'animate-[modal-in_0.32s_ease-out]'
                    }`}
            >
            <form onSubmit={handleSubmit} noValidate>
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

                <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
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

                    <div className="font-body text-body-sm font-semibold text-heading">
                        <label id="group-teacher-label">
                            {t('admin.groups.teacher')}
                        </label>

                        <div
                            ref={teacherSelectorRef}
                            className="relative mt-xs"
                        >
                            <button
                                type="button"
                                disabled={loadingTeachers || teachers.length === 0}
                                aria-haspopup="listbox"
                                aria-expanded={teacherMenuOpen}
                                aria-labelledby="group-teacher-label"
                                onClick={() =>
                                    setTeacherMenuOpen((current) => !current)
                                }
                                className="flex h-11 w-full items-center justify-between gap-sm rounded-xl border border-neutral-200 bg-white px-md text-left font-body text-body-sm font-normal text-heading outline-none transition-colors hover:border-neutral-400 focus:border-heading disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="truncate text-neutral-600">
                                    {teacherPlaceholder}
                                </span>

                                <svg
                                    className={`size-4 shrink-0 text-neutral-500 transition-transform ${
                                        teacherMenuOpen ? 'rotate-180' : ''
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {teacherMenuOpen && (
                                <div className="absolute left-0 top-full z-[100] mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-xs shadow-lg">
                                    {teachers.map((teacher) => {
                                        const selected = form.teacherIds.includes(
                                            teacher.id,
                                        )

                                        return (
                                            <label
                                                key={teacher.id}
                                                className="flex cursor-pointer items-center gap-sm rounded-lg px-md py-sm font-body text-body-sm font-normal text-heading transition-colors hover:bg-orange-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        toggleTeacher(teacher.id)
                                                    }
                                                    className="size-4 shrink-0 accent-orange-500"
                                                />

                                                <span className="min-w-0 truncate">
                                                    {teacher.firstName}{' '}
                                                    {teacher.lastName}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {selectedTeachers.length > 0 && (
                            <div className="mt-sm flex flex-wrap gap-xs">
                                {selectedTeachers.map((teacher) => (
                                    <span
                                        key={teacher.id}
                                        className="inline-flex max-w-full items-center gap-xs rounded-full border border-orange-200 bg-orange-50 py-1 pl-sm pr-xs font-body text-caption font-medium text-heading"
                                    >
                                        <span className="max-w-[180px] truncate">
                                            {teacher.firstName} {teacher.lastName}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                removeTeacher(teacher.id)
                                            }
                                            aria-label={t('admin.groups.removeTeacher', { name: `${teacher.firstName} ${teacher.lastName}` })}
                                            className="flex size-5 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-orange-200 hover:text-heading disabled:opacity-50"
                                        >
                                            <svg
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="size-3"
                                                aria-hidden="true"
                                            >
                                                <path d="m5 5 10 10M15 5 5 15" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {fieldErrors.teacherIds && (
                            <span className="mt-xs block font-normal text-danger">
                                {fieldErrors.teacherIds}
                            </span>
                        )}
                    </div>

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
                        className="h-11 rounded-full blob-fill bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t(
                            group
                                ? 'admin.groups.update'
                                : 'admin.groups.create',
                        )}
                    </button>
                </div>
            </form>
            </dialog>
        </div>
    )
}

export default GroupFormModal
