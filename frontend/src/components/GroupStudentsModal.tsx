import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ModalCloseButton from './ui/ModalCloseButton.tsx'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import { useModalVisibility } from '../hooks/useModalExit.ts'
import { childService, type ChildOption } from '../services/child.ts'
import { groupService } from '../services/group.ts'
import { notify, notifyError } from '../utils/notifications.ts'
import { getErrorMessage } from '../utils/error.ts'

import type { Group, GroupChild } from '../types/group.ts'

interface GroupStudentsModalProps {
  isOpen: boolean
  group: Group | null
  onClose: () => void
  onChanged: (group: Group) => void
}

function GroupStudentsModal({
  isOpen,
  group,
  onClose,
  onChanged,
}: Readonly<GroupStudentsModalProps>) {
  const { t } = useTranslation()
  const { shouldRender, closing } = useModalVisibility(isOpen)
  const [currentGroup, setCurrentGroup] = useState<Group | null>(group)
  const [children, setChildren] = useState<ChildOption[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [loadingChildren, setLoadingChildren] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [childToRemove, setChildToRemove] = useState<GroupChild | null>(null)

  useEffect(() => {
    if (!isOpen || !group) return

    let mounted = true

    const loadChildren = async () => {
      try {
        setLoadingChildren(true)
        const options = await childService.getChildrenOptions()
        if (mounted) setChildren(options)
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err))
          notifyError(t('admin.groups.loadStudentsError'), err)
        }
      } finally {
        if (mounted) setLoadingChildren(false)
      }
    }

    void loadChildren()

    return () => {
      mounted = false
    }
  }, [group, isOpen, t])

  const assignedChildIds = useMemo(
    () => new Set((currentGroup?.children ?? []).map((child) => child.id)),
    [currentGroup?.children],
  )

  const availableChildren = useMemo(
    () => children.filter((child) => !assignedChildIds.has(child.id)),
    [assignedChildIds, children],
  )

  const updateGroup = (updatedGroup: Group) => {
    setCurrentGroup(updatedGroup)
    onChanged(updatedGroup)
  }

  const handleAdd = async () => {
    if (!currentGroup || !selectedChildId || saving) return

    try {
      setSaving(true)
      const updatedGroup = await groupService.addChild(
        currentGroup.id,
        Number(selectedChildId),
      )
      updateGroup(updatedGroup)
      setSelectedChildId('')
      setError(null)
      notify.success(t('admin.groups.studentAssigned'))
    } catch (err) {
      setError(getErrorMessage(err))
      notifyError(t('admin.groups.assignStudentError'), err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!currentGroup || !childToRemove || saving) return

    try {
      setSaving(true)
      const updatedGroup = await groupService.removeChild(
        currentGroup.id,
        childToRemove.id,
      )
      updateGroup(updatedGroup)
      setChildToRemove(null)
      setError(null)
      notify.success(t('admin.groups.studentRemoved'))
    } catch (err) {
      setError(getErrorMessage(err))
      notifyError(t('admin.groups.removeStudentError'), err)
    } finally {
      setSaving(false)
    }
  }

  if (!shouldRender || !currentGroup) return null

  return (
    <>
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
          aria-label={t('admin.groups.students')}
          className={`modal-scroll relative mx-auto my-0 max-h-full w-full max-w-[620px] overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg text-inherit shadow-lg md:p-xl ${
            closing
              ? 'animate-[modal-out_0.32s_ease-in]'
              : 'animate-[modal-in_0.32s_ease-out]'
          }`}
        >
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="m-0 font-heading text-h4 font-bold text-heading">
                {t('admin.groups.students')}
              </h2>
              <p className="mt-xs m-0 font-body text-body-sm text-neutral-500">
                {currentGroup.name}
              </p>
            </div>

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

          <div className="mt-lg rounded-xl border border-neutral-200 bg-neutral-50 p-md">
            <label
              htmlFor="group-student-select"
              className="font-body text-body-sm font-semibold text-heading"
            >
              {t('admin.groups.assignStudent')}
            </label>

            <div className="mt-sm flex flex-col gap-sm sm:flex-row">
              <select
                id="group-student-select"
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(event.target.value)}
                disabled={loadingChildren || saving || availableChildren.length === 0}
                className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-heading outline-none focus:border-heading disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {loadingChildren
                    ? t('admin.children.loadingOptions')
                    : availableChildren.length === 0
                      ? t('admin.groups.noAvailableStudents')
                      : t('admin.groups.selectStudent')}
                </option>
                {availableChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.fullName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={!selectedChildId || saving}
                className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? t('common.loading') : t('admin.groups.assignStudent')}
              </button>
            </div>
          </div>

          <div className="mt-lg">
            <h3 className="m-0 font-body text-body-sm font-semibold text-heading">
              {t('admin.groups.enrolledChildren')}
            </h3>

            {currentGroup.children.length === 0 ? (
              <p className="mt-sm rounded-xl border border-dashed border-neutral-300 p-md font-body text-body-sm text-neutral-500">
                {t('admin.groups.noStudents')}
              </p>
            ) : (
              <ul className="mt-sm m-0 flex list-none flex-col gap-sm p-0">
                {currentGroup.children.map((child) => (
                  <li
                    key={child.id}
                    className="flex items-center justify-between gap-md rounded-xl border border-neutral-200 bg-white px-md py-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-body text-body-sm font-semibold text-heading">
                        {child.fullName}
                      </span>
                      <span className="block font-body text-caption text-neutral-500">
                        {child.studentId}
                      </span>
                    </span>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setChildToRemove(child)}
                      className="shrink-0 rounded-full border border-red-200 px-sm py-xs font-body text-caption font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      {t('admin.groups.removeStudent')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </dialog>
      </div>

      {childToRemove && (
        <DeleteConfirmModal
          title={t('admin.groups.removeStudent')}
          message={t('admin.groups.removeStudentConfirm', {
            name: childToRemove.fullName,
          })}
          confirmLabel={t('admin.groups.removeStudent')}
          onConfirm={handleRemove}
          onClose={() => setChildToRemove(null)}
        />
      )}
    </>
  )
}

export default GroupStudentsModal
