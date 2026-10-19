
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserRoundIcon } from '@animateicons/react/lucide'

import Button from './ui/Button.tsx'
import DatePickerField from './ui/DatePickerField.tsx'
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import FieldHint from './ui/FieldHint.tsx'

import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'

import { getErrorMessage } from '../utils/error.ts'
import {
  validateEmail,
  validateRequired,
  validateSafeText,
} from '../utils/validators.ts'

import type { UserInfo, UpdateUserData } from '../types/auth.ts'
import type { CreateTeacherData } from '../services/admin.ts'

    interface TeacherFormModalProps {
    teacher?: UserInfo | null
    onCreate: (data: CreateTeacherData) => Promise<void>
    onUpdate: (id: string, data: UpdateUserData) => Promise<void>
    onUploadPhoto: (id: string, file: File) => Promise<void>
    onDeletePhoto: (id: string) => Promise<void>
    onClose: () => void
    }

    function TeacherFormModal({
    teacher,
    onCreate,
    onUpdate,
    onUploadPhoto,
    onDeletePhoto,
    onClose,
    }: Readonly<TeacherFormModalProps>) {
    const { t } = useTranslation()

    const dialogRef = useRef<HTMLDialogElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { closing, requestClose } = useModalExit(onClose)

    const isEditing = Boolean(teacher)

    const [firstName, setFirstName] = useState(teacher?.firstName ?? '')
    const [lastName, setLastName] = useState(teacher?.lastName ?? '')
    const [email, setEmail] = useState(teacher?.email ?? '')
    const [password, setPassword] = useState('')
    const [birthday, setBirthday] = useState(teacher?.birthday ?? '')

    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [removePhoto, setRemovePhoto] = useState(false)

    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const [firstNameError, setFirstNameError] = useState<string | null>(null)
    const [lastNameError, setLastNameError] = useState<string | null>(null)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    useDialogDismiss(dialogRef, requestClose, !saving)

    // Abrir modal
    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    // Vista previa de fotografía
    useEffect(() => {
        if (!selectedPhoto) {
        setPhotoPreview(null)
        return
        }

        const url = URL.createObjectURL(selectedPhoto)

        setPhotoPreview(url)

        return () => URL.revokeObjectURL(url)
    }, [selectedPhoto])

    // Seleccionar fotografía
    const handlePhotoChange = (file?: File) => {
        if (!file) return

        if (!file.type.startsWith('image/')) {
        setSaveError(t('admin.teachers.invalidPhoto'))
        return
        }

        if (file.size > 5 * 1024 * 1024) {
        setSaveError(t('admin.teachers.photoTooLarge'))
        return
        }

        setSelectedPhoto(file)
        setRemovePhoto(false)
        setSaveError(null)
    }

    // Guardar profesor
    const handleSave = async () => {
        const firstError =
        validateRequired(firstName, t('admin.firstName'), t) ??
        validateSafeText(firstName, t)

        const lastError =
        validateRequired(lastName, t('admin.lastName'), t) ??
        validateSafeText(lastName, t)

        const mailError = validateEmail(email, t)

        let passError: string | null = null

        if (!isEditing && !password.trim()) {
        passError = t('admin.teachersPage.passwordRequired')
        } else if (!isEditing && password.length < 8) {
        passError = t('admin.teachersPage.passwordMin')
        }

        setFirstNameError(firstError)
        setLastNameError(lastError)
        setEmailError(mailError)
        setPasswordError(passError)

        if (firstError || lastError || mailError || passError) {
        return
        }

        setSaving(true)
        setSaveError(null)

        try {
        if (teacher) {
            await onUpdate(teacher.id, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            birthday: birthday || undefined,
            })

            if (removePhoto && teacher.photoUrl) {
            await onDeletePhoto(teacher.id)
            }

            if (selectedPhoto) {
            await onUploadPhoto(teacher.id, selectedPhoto)
            }
        } else {
            await onCreate({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            birthday: birthday || undefined,
            })
        }

        requestClose()
        } catch (err) {
        setSaveError(getErrorMessage(err))
        } finally {
        setSaving(false)
        }
    }

    return (
        <dialog
        ref={dialogRef}
        onClose={requestClose}
        aria-label={
            isEditing
            ? t('admin.teachers.editTitle')
            : t('admin.teachersPage.register')
        }
        className={`text-left fixed inset-0 m-auto max-h-[90vh] w-[min(820px,92vw)] max-w-none modal-scroll rounded-[20px] border border-neutral-200 bg-white p-lg backdrop:bg-scrim md:p-xl ${
            closing
            ? 'animate-[modal-out_0.32s_ease-in]'
            : 'animate-[modal-in_0.32s_ease-out]'
        }`}
        >
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-h4 font-bold text-heading">
            {isEditing
                ? t('admin.teachers.editTitle')
                : t('admin.teachersPage.register')}
            </h2>

            <ModalCloseButton
            onClick={requestClose}
            disabled={saving}
            aria-label={t('admin.cancel')}
            className="disabled:opacity-50"
            />
        </div>

        {/* Fotografía */}
        <div className="mt-lg flex flex-col items-center gap-sm">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-green-100 bg-green-50">
            {photoPreview || (teacher?.photoUrl && !removePhoto) ? (
                <img
                src={photoPreview || teacher?.photoUrl || ''}
                alt={t('admin.teachers.photoAlt')}
                className="h-full w-full object-cover"
                />
            ) : (
                <UserRoundIcon
                size={44}
                className="text-green-500"
                />
            )}
            </div>

            {isEditing ? (
            <>
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                    handlePhotoChange(e.target.files?.[0])
                }
                />

                <div className="flex flex-wrap justify-center gap-sm">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-green-500 px-md py-xs font-body text-body-sm font-semibold text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                >
                    {teacher?.photoUrl && !removePhoto
                    ? t('admin.teachers.changePhoto')
                    : t('admin.teachers.addPhoto')}
                </button>

                {(teacher?.photoUrl || selectedPhoto) && (
                    <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                        setSelectedPhoto(null)
                        setRemovePhoto(true)

                        if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                        }
                    }}
                    className="rounded-full border border-red-300 px-md py-xs font-body text-body-sm font-semibold text-danger transition hover:bg-red-50 disabled:opacity-50"
                    >
                    {t('admin.teachers.deletePhoto')}
                    </button>
                )}
                </div>
            </>
            ) : (
            <p className="m-0 text-center font-body text-body-sm text-neutral-500">
                {t('admin.teachersPage.photoAfterRegister')}
            </p>
            )}
        </div>

        {/* Campos */}
        <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">

            {/* Nombre */}
            <label className="font-body text-body-sm font-semibold text-heading">
            {t('admin.firstName')}

            <input
                placeholder={t('fields.person.firstName.placeholder')}
                type="text"
                value={firstName}
                onChange={(e) => {
                setFirstName(e.target.value)
                setFirstNameError(null)
                }}
                disabled={saving}
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading disabled:opacity-50"
            />

            <FieldHint>
                {t('fields.person.firstName.hint')}
            </FieldHint>

            {firstNameError && (
                <span className="mt-xs block font-normal text-danger">
                {firstNameError}
                </span>
            )}
            </label>

            {/* Apellido */}
            <label className="font-body text-body-sm font-semibold text-heading">
            {t('admin.lastName')}

            <input
                placeholder={t('fields.person.lastName.placeholder')}
                type="text"
                value={lastName}
                onChange={(e) => {
                setLastName(e.target.value)
                setLastNameError(null)
                }}
                disabled={saving}
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading disabled:opacity-50"
            />

            <FieldHint>
                {t('fields.person.lastName.hint')}
            </FieldHint>

            {lastNameError && (
                <span className="mt-xs block font-normal text-danger">
                {lastNameError}
                </span>
            )}
            </label>

            {/* Correo */}
            <label className="font-body text-body-sm font-semibold text-heading">
            {t('admin.email')}

            <input
                placeholder={t('fields.person.email.placeholder')}
                type="email"
                value={email}
                onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
                }}
                disabled={saving || isEditing}
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading disabled:cursor-not-allowed disabled:bg-neutral-100"
            />

            {isEditing && (
                <span className="mt-xs block font-body text-caption font-normal text-neutral-500">
                {t('admin.emailLockedHint')}
                </span>
            )}

            {emailError && (
                <span className="mt-xs block font-normal text-danger">
                {emailError}
                </span>
            )}
            </label>

            {/* Fecha de nacimiento */}
            <div className="font-body text-body-sm font-semibold text-heading">
            {t('admin.birthday')}

            <DatePickerField
                value={birthday}
                onChange={setBirthday}
                max={new Date().toISOString().split('T')[0]}
                disabled={saving}
                ariaLabel={t('admin.birthday')}
            />

            <FieldHint>
                {t('fields.person.birthday.hint')}
            </FieldHint>
            </div>

            {/* Contraseña */}
            {!isEditing && (
            <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
                {t('admin.teachersPage.password')}

                <input
                placeholder={t('fields.person.password.placeholder')}
                type="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(null)
                }}
                disabled={saving}
                autoComplete="new-password"
                className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading disabled:opacity-50"
                />

                <span className="mt-xs block font-body text-caption font-normal text-neutral-500">
                {t('admin.teachersPage.passwordHint')}
                </span>

                {passwordError && (
                <span className="mt-xs block font-normal text-danger">
                    {passwordError}
                </span>
                )}
            </label>
            )}
        </div>

        {/* Errores */}
        {saveError && (
            <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
            {saveError}
            </p>
        )}

        {/* Acciones */}
        <div className="mt-lg flex flex-wrap justify-end gap-md *:flex-1">
            <Button
            variant="secondary"
            onClick={requestClose}
            disabled={saving}
            className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
            >
            {t('admin.cancel')}
            </Button>

            <Button
            variant="success"
            onClick={handleSave}
            loading={saving}
            disabled={
                saving ||
                !firstName.trim() ||
                !lastName.trim() ||
                !email.trim() ||
                (!isEditing && !password)
            }
            className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
            >
            {saving ? t('common.loading') : t('admin.save')}
            </Button>
        </div>
        </dialog>
    )
}

export default TeacherFormModal
