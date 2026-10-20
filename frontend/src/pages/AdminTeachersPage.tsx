
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'

import AdminLayout from '../layout/AdminLayout.tsx'
import TeacherCard from '../components/TeacherCard.tsx'
import TeacherFormModal from '../components/TeacherFormModal.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import DeleteUserModal from '../components/DeleteUserModal.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'

import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

import { adminService } from '../services/admin.ts'
import { notify } from '../utils/notifications.ts'
import { getErrorMessage } from '../utils/error.ts'
import { userStorage } from '../utils/userStorage.ts'

import type { CreateTeacherData } from '../services/admin.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

const PAGE_SIZE = 10

function AdminTeachersPage() {
    const { t } = useTranslation()

    const [teachers, setTeachers] = useState<UserInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const [teacherToEdit, setTeacherToEdit] = useState<UserInfo | null>(null)
    const [teacherToDelete, setTeacherToDelete] = useState<UserInfo | null>(null)

    const currentUser = userStorage.getUser()

    // Cargar docentes
    useEffect(() => {
        let active = true

        const loadTeachers = async () => {
            try {
                const data = await adminService.getTeachers()

                if (active) {
                    setTeachers(
                        data.filter((user) => user.role === 'TEACHER')
                    )
                    setError(null)
                }
            } catch (err) {
                if (active) {
                    setError(getErrorMessage(err))
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        void loadTeachers()

        return () => {
            active = false
        }
    }, [])

    // Filtrar docentes
    const filteredTeachers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()

        if (!term) return teachers

        return teachers.filter((teacher) =>
            [
                teacher.firstName,
                teacher.lastName,
                teacher.email,
            ].some((field) =>
                field.toLowerCase().includes(term)
            )
        )
    }, [teachers, searchTerm])

    // Paginación
    const totalPages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / PAGE_SIZE)
    )

    const safeCurrentPage = Math.min(currentPage, totalPages)

    const pagedTeachers = filteredTeachers.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE
    )

    // Registro deshabilitado
    const handleCreateDisabled = (
        _data: CreateTeacherData
    ): Promise<void> =>
        Promise.reject(new Error('El registro de docentes no está disponible.'))

    // Actualizar docente
    const handleUpdate = async (id: string, data: UpdateUserData) => {
        const updated = await adminService.updateUser(id, data)

        setTeachers((prev) =>
            prev.map((teacher) =>
                teacher.id === id
                    ? { ...teacher, ...updated }
                    : teacher
            )
        )

        notify.success(t('admin.teachers.updateSuccess'))
    }

    // Subir fotografía
    const handleUploadPhoto = async (id: string, file: File) => {
        const updated = await adminService.uploadTeacherPhoto(id, file)

        setTeachers((prev) =>
            prev.map((teacher) =>
                teacher.id === id
                    ? { ...teacher, ...updated }
                    : teacher
            )
        )

        notify.success(t('admin.teachers.uploadPhotoSuccess'))
    }

    // Eliminar fotografía
    const handleDeletePhoto = async (id: string) => {
        await adminService.deleteTeacherPhoto(id)

        setTeachers((prev) =>
            prev.map((teacher) =>
                teacher.id === id
                    ? { ...teacher, photoUrl: null }
                    : teacher
            )
        )

        notify.success(t('admin.teachers.deletePhotoSuccess'))
    }

    // Eliminar docente
    const handleDelete = async (id: string) => {
        try {
            await adminService.deleteUser(id)

            setTeachers((prev) =>
                prev.filter((teacher) => teacher.id !== id)
            )

            setTeacherToDelete(null)

            notify.success(t('admin.teachers.deleteSuccess'))
        } catch (err) {
            notify.error(getErrorMessage(err))
            throw err
        }
    }

    // Skeletons
    const skeletonCount = useSkeletonCount(
        'admin-teachers',
        loading,
        filteredTeachers.length,
        4
    )

    return (
        <AdminLayout>
            <section className="w-full min-w-0">

                {/* Encabezado */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                            {t('admin.teachers.title')}
                        </h1>

                        <p className="mt-2 font-body text-body text-neutral-500">
                            {t('admin.teachers.description')}
                        </p>
                    </div>

                    {/* Buscador */}
                    <div className="flex w-full min-w-0 items-center md:w-auto">
                        <div className="flex h-11 w-full min-w-0 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px]">
                            <SearchIcon
                                size={18}
                                className="shrink-0 text-neutral-500"
                                aria-hidden="true"
                            />

                            <input
                                type="search"
                                placeholder={t('admin.teachers.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                aria-label={t('admin.teachers.searchLabel')}
                                className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text-dark outline-none placeholder:text-neutral-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Cargando */}
                {loading && (
                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <SkeletonList count={skeletonCount}>
                            {() => <TeacherCard loading showPhoto />}
                        </SkeletonList>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <p className="mt-8 font-body text-danger">
                        {error}
                    </p>
                )}

                {/* Lista de docentes */}
                {!loading && !error && filteredTeachers.length > 0 && (
                    <>
                        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {pagedTeachers.map((teacher) => (
                                <TeacherCard
                                    key={teacher.id}
                                    user={teacher}
                                    showPhoto
                                    isSelf={teacher.id === currentUser?.id}
                                    onEdit={() => setTeacherToEdit(teacher)}
                                    onDelete={() => setTeacherToDelete(teacher)}
                                />
                            ))}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={safeCurrentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}

                {/* Estado vacío */}
                {!loading && !error && filteredTeachers.length === 0 && (
                    <div className="mt-12 text-center">
                        <p className="font-body text-body-text">
                            {searchTerm
                                ? t('admin.teachers.noSearchResults')
                                : t('admin.teachers.empty')}
                        </p>
                    </div>
                )}

                {/* Editar docente */}
                {teacherToEdit && (
                    <TeacherFormModal
                        teacher={teacherToEdit}
                        onCreate={handleCreateDisabled}
                        onUpdate={handleUpdate}
                        onUploadPhoto={handleUploadPhoto}
                        onDeletePhoto={handleDeletePhoto}
                        onClose={() => setTeacherToEdit(null)}
                    />
                )}

                {/* Eliminar docente */}
                {teacherToDelete && (
                    <DeleteUserModal
                        user={teacherToDelete}
                        onConfirm={handleDelete}
                        onClose={() => setTeacherToDelete(null)}
                    />
                )}

            </section>
        </AdminLayout>
    )
}

export default AdminTeachersPage
