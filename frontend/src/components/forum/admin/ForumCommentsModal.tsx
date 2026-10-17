import { useTranslation } from 'react-i18next'
import { useModalExit } from '../../../hooks/useModalExit.ts'
import CardActionButton from '../../ui/CardActionButton.tsx'
import ModalCloseButton from '../../ui/ModalCloseButton.tsx'
import Skeleton from '../../ui/Skeleton.tsx'
import SkeletonList from '../../ui/SkeletonList.tsx'

export interface ForumCommentItem {
  id: string
  alias: string
  content: string
  createdAt: string
}

interface ForumCommentsModalProps<T extends ForumCommentItem> {
  subtitle: string
  comments: T[]
  loading: boolean
  skeletonCount: number
  deletingId: string | null
  error: string
  canDelete: boolean
  onDeleteRequest: (comment: T) => void
  onClose: () => void
}

function CommentRowSkeleton({ canDelete }: Readonly<{ canDelete: boolean }>) {
  return (
    <div className="flex items-start justify-between gap-md border-b border-neutral-100 py-md last:border-0">
      <div className="min-w-0 flex-1">
        <Skeleton shape="line" className="h-4 w-32" />
        <Skeleton shape="line" className="mt-sm h-3.5 w-full" />
        <Skeleton shape="line" className="mt-xs h-3.5 w-3/4" />
        <Skeleton shape="line" className="mt-sm h-3 w-28" />
      </div>
      {canDelete && <Skeleton shape="circle" className="size-8 shrink-0" />}
    </div>
  )
}

function ForumCommentsModal<T extends ForumCommentItem>({
  subtitle,
  comments,
  loading,
  skeletonCount,
  deletingId,
  error,
  canDelete,
  onDeleteRequest,
  onClose,
}: Readonly<ForumCommentsModalProps<T>>) {
  const { t } = useTranslation()
  const { closing, requestClose } = useModalExit(onClose)

  return (
    <div className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('adminForum.close')}
        className="absolute inset-0 size-full cursor-default"
        onClick={requestClose}
      />

      <div className={`relative mx-auto max-h-full modal-scroll w-full max-w-[680px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}>
        <div className="flex items-center justify-between gap-md">
          <div className="min-w-0">
            <h2 className="m-0 font-heading text-h4 font-bold text-heading">
              {t('adminForum.commentsModalTitle')}
            </h2>
            <p className="m-0 mt-2xs truncate font-body text-body-sm text-neutral-500">
              {subtitle}
            </p>
          </div>

          <ModalCloseButton
            onClick={requestClose}
            aria-label={t('adminForum.close')}
          />
        </div>

        <div className="mt-lg max-h-[60vh] overflow-y-auto">
          {loading && (
            <div aria-busy="true" aria-label={t('adminForum.loadingComments')}>
              <SkeletonList count={Math.min(10, Math.max(1, skeletonCount))}>
                {() => <CommentRowSkeleton canDelete={canDelete} />}
              </SkeletonList>
            </div>
          )}

          {!loading && error && (
            <p className="m-0 rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && !error && comments.length === 0 && (
            <p className="m-0 font-body text-body-sm text-neutral-500">
              {t('adminForum.noComments')}
            </p>
          )}

          {!loading && !error && comments.map((comment) => comment.id === deletingId ? (
            <CommentRowSkeleton key={comment.id} canDelete={canDelete} />
          ) : (
            <div
              key={comment.id}
              className="flex items-start justify-between gap-md border-b border-neutral-100 py-md last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 font-body text-body-sm font-bold text-heading">
                  {comment.alias}
                </p>
                <p className="m-0 mt-2xs whitespace-pre-line break-words font-body text-body-sm text-body-text">
                  {comment.content}
                </p>
                <p className="m-0 mt-2xs font-body text-caption text-neutral-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>

              {canDelete && (
                <CardActionButton
                  action="delete"
                  size="sm"
                  label={`${t('adminForum.deleteCommentTitle')} — ${comment.alias}`}
                  onClick={() => onDeleteRequest(comment)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ForumCommentsModal
