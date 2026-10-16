
import { useEffect, useMemo, useState } from 'react'
import { SearchIcon } from '@animateicons/react/lucide'

import AdminLayout from '../layout/AdminLayout.tsx'
import TeacherCard from '../components/TeacherCard.tsx'
import TeacherFormModal from '../components/TeacherFormModal.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import DeleteUserModal from '../components/DeleteUserModal.tsx'

import { adminService } from '../services/admin.ts'
import type { CreateTeacherData } from '../services/admin.ts'
import { notify } from '../utils/notifications.ts'
import { getErrorMessage } from '../utils/error.ts'
import { userStorage } from '../utils/userStorage.ts'

import type { UserInfo, UpdateUserData } from '../types/auth.ts'

    const PAGE_SIZE = 10

    function AdminTeachersPage() {
    const [teachers, setTeachers] = useState<UserInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [teacherToEdit, setTeacherToEdit] = useState<UserInfo | null>(null)
    const [teacherToDelete, setTeacherToDelete] = useState<UserInfo | null>(null)

    const currentUser = userStorage.getUser()

    // Obtener docentes
    const fetchTeachers = async () => {
        try {
        setError(null)

        const data = await adminService.getTeachers()
        setTeachers(data.filter((user) => user.role === 'TEACHER'))
        } catch (err) {
        setError(getErrorMessage(err))
        throw err
        }
    }

    useEffect(() => {
        let active = true

        const loadTeachers = async () => {
        try {
            const data = await adminService.getTeachers()

            if (active) {
            setTeachers(data.filter((user) => user.role === 'TEACHER'))
            }
        } catch (err) {
            if (active) setError(getErrorMessage(err))
        } finally {
            if (active) setLoading(false)
        }
        }

        void loadTeachers()

        return () => {
        active = false
        }
    }, [])

    // Buscador
    const filteredTeachers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()

        if (!term) return teachers

        return teachers.filter((teacher) =>
        [teacher.firstName, teacher.lastName, teacher.email].some((field) =>
            field.toLowerCase().includes(term),
        ),
        )
    }, [teachers, searchTerm])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / PAGE_SIZE),
    )

    const safeCurrentPage = Math.min(currentPage, totalPages)

    const pagedTeachers = filteredTeachers.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE,
    )

    // Registrar docente
    const handleCreate = async (data: CreateTeacherData) => {
        await adminService.createTeacher(data)
        await fetchTeachers()
        setCurrentPage(1)
        notify.success('Docente registrado correctamente')
    }

    // Editar docente
    const handleUpdate = async (id: string, data: UpdateUserData) => {
        const updated = await adminService.updateUser(id, data)

        setTeachers((prev) =>
        prev.map((teacher) =>
            teacher.id === id
            ? { ...teacher, ...updated }
            : teacher,
        ),
        )

        notify.success('Información del docente actualizada')
    }

    // Subir fotografía
    const handleUploadPhoto = async (id: string, file: File) => {
        const updated = await adminService.uploadTeacherPhoto(id, file)

        setTeachers((prev) =>
        prev.map((teacher) =>
            teacher.id === id
            ? { ...teacher, ...updated }
            : teacher,
        ),
        )

        notify.success('Fotografía actualizada correctamente')
    }

    // Eliminar fotografía
    const handleDeletePhoto = async (id: string) => {
        await adminService.deleteTeacherPhoto(id)

        setTeachers((prev) =>
        prev.map((teacher) =>
            teacher.id === id
            ? { ...teacher, photoUrl: null }
            : teacher,
        ),
        )

        notify.success('Fotografía eliminada correctamente')
    }

    // Eliminar docente
    const handleDelete = async (id: string) => {
        try {
        await adminService.deleteUser(id)

        setTeachers((prev) =>
            prev.filter((teacher) => teacher.id !== id),
        )

        setTeacherToDelete(null)
        notify.success('Docente eliminado correctamente')
        } catch (err) {
        notify.error(getErrorMessage(err))
        throw err
        }
    }

    return (
        <AdminLayout>
        <section className="w-full">

            {/* Encabezado */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                Gestión de docentes
                </h1>

                <p className="mt-2 font-body text-body text-neutral-500">
                Administra los docentes de My Green Farm.
                </p>
            </div>

            {/* Acciones */}
            <div className="flex w-full items-center gap-3 md:w-auto">
                <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                title="Registrar docente"
                aria-label="Registrar docente"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600"
                >
                <span className="text-3xl font-light leading-none">+</span>
                </button>

                {/* Buscador */}
                <div className="flex h-11 min-w-0 flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px] md:flex-none">
                <SearchIcon
                    size={18}
                    className="shrink-0 text-neutral-500"
                    aria-hidden="true"
                />

                <input
                    type="search"
                    placeholder="Buscar docente..."
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                    }}
                    aria-label="Buscar docente"
                    className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                />
                </div>
            </div>
            </div>

            {/* Cargando */}
            {loading && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TeacherCard loading showPhoto />
                <TeacherCard loading showPhoto />
                <TeacherCard loading showPhoto />
                <TeacherCard loading showPhoto />
            </div>
            )}

            {/* Error */}
            {!loading && error && (
            <p className="mt-8 font-body text-danger">
                {error}
            </p>
            )}

            {/* Docentees */}
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

                {totalPages > 1 && (
                <Pagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
                )}
            </>
            )}

            {/* Sin docentes */}
            {!loading && !error && filteredTeachers.length === 0 && (
            <div className="mt-12 text-center">
                <p className="font-body text-body-text">
                {searchTerm
                    ? 'No se encontraron docentes con ese nombre.'
                    : 'Todavía no hay docentes registrados.'}
                </p>
            </div>
            )}

            {/* Registrar docente */}
            {isCreateModalOpen && (
            <TeacherFormModal
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onUploadPhoto={handleUploadPhoto}
                onDeletePhoto={handleDeletePhoto}
                onClose={() => setIsCreateModalOpen(false)}
            />
            )}

            {/* Editar docente */}
            {teacherToEdit && (
            <TeacherFormModal
                teacher={teacherToEdit}
                onCreate={handleCreate}
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
