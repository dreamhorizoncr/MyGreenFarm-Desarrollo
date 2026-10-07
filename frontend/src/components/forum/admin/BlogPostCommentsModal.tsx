import { useTranslation } from 'react-i18next'
import { Trash2Icon, XIcon } from '@animateicons/react/lucide'
import type { BlogComment, BlogPost } from '../../../types/forum.ts'

interface BlogPostCommentsModalProps {
  post: BlogPost
  comments: BlogComment[]
  loading: boolean
  error: string
  canDelete: boolean
  onDeleteRequest: (comment: BlogComment) => void
  onClose: () => void
}

function BlogPostCommentsModal({
  post,
  comments,
  loading,
  error,
  canDelete,
  onDeleteRequest,
  onClose,
}: Readonly<BlogPostCommentsModalProps>) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('adminForum.close')}
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />

      <div className="relative mx-auto w-full max-w-[680px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl">
        <div className="flex items-center justify-between gap-md">
          <div className="min-w-0">
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">
              {t('adminForum.commentsModalTitle')}
            </h2>
            <p className="m-0 mt-2xs truncate font-body text-body-sm text-neutral-500">
              {post.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('adminForum.close')}
            className="shrink-0 rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="mt-lg max-h-[60vh] overflow-y-auto">
          {loading && (
            <p className="m-0 font-body text-body-sm text-neutral-500">
              {t('adminForum.loadingComments')}
            </p>
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

          {!loading && !error && comments.map((comment) => (
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
                <button
                  type="button"
                  onClick={() => onDeleteRequest(comment)}
                  aria-label={`${t('adminForum.deleteCommentTitle')} — ${comment.alias}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-300 text-danger transition hover:bg-red-50"
                >
                  <Trash2Icon size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BlogPostCommentsModal
