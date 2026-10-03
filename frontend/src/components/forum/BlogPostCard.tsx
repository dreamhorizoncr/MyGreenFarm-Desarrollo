import { useTranslation } from 'react-i18next'
import { HeartIcon, MessageCircleIcon, PencilIcon, Trash2Icon } from '@animateicons/react/lucide'
import type { BlogPost } from '../../types/forum.ts'
import PostAvatar from './PostAvatar.tsx'

interface BlogPostCardProps {
  post: BlogPost
  commentCount: number
  isLiked: boolean
  likeCount: number
  onToggleLike: (postId: string) => void
  onOpen?: (postId: string) => void
  onOpenComments?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
}

interface LikeControlProps {
  isInteractive: boolean
  isLiked: boolean
  likeCount: number
  onToggle: () => void
}

function LikeControl({ isInteractive, isLiked, likeCount, onToggle }: Readonly<LikeControlProps>) {
  const { t } = useTranslation()

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        aria-pressed={isLiked}
        aria-label={t('forum.likes.label')}
        className={`flex items-center gap-xs font-body text-body-sm transition ${
          isLiked ? 'text-danger' : 'text-neutral-500 hover:text-danger'
        }`}
      >
        <HeartIcon size={18} className={isLiked ? 'fill-current' : ''} />
        <span>{likeCount}</span>
      </button>
    )
  }

  return (
    <span
      aria-label={t('forum.likes.label')}
      className="flex items-center gap-xs font-body text-body-sm text-neutral-500"
    >
      <HeartIcon size={18} aria-hidden="true" />
      <span>{likeCount}</span>
    </span>
  )
}

interface CommentsControlProps {
  commentCount: number
  onOpenComments?: () => void
}

function CommentsControl({ commentCount, onOpenComments }: Readonly<CommentsControlProps>) {
  const { t } = useTranslation()

  if (onOpenComments) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpenComments()
        }}
        aria-label={t('forum.blog.commentsTitle')}
        className="flex items-center gap-xs font-body text-body-sm text-neutral-500 hover:text-heading"
      >
        <MessageCircleIcon size={18} />
        <span>{commentCount}</span>
      </button>
    )
  }

  return (
    <span
      aria-label={t('forum.blog.commentsTitle')}
      className="flex items-center gap-xs font-body text-body-sm text-neutral-500"
    >
      <MessageCircleIcon size={18} />
      <span>{commentCount}</span>
    </span>
  )
}

function BlogPostCard({
  post,
  commentCount,
  isLiked,
  likeCount,
  onToggleLike,
  onOpen,
  onOpenComments,
  onEdit,
  onDelete,
}: Readonly<BlogPostCardProps>) {
  const { t } = useTranslation()
  const isInteractive = Boolean(onOpen)

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left ${
        isInteractive ? 'cursor-pointer transition hover:opacity-95' : ''
      }`}
    >
      {isInteractive && (
        <button
          type="button"
          onClick={() => onOpen?.(post.id)}
          aria-label={post.title}
          className="absolute inset-0 z-0 rounded-2xl"
        />
      )}

      <div className="h-[160px] shrink-0 bg-neutral-100 xs:h-[220px]">
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.imageAlt ?? ''}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 p-lg">
        <div className="flex flex-wrap items-center gap-md">
          <PostAvatar
            name={post.authorName}
            src={post.authorAvatarUrl}
            size={32}
          />

          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-heading text-body-sm font-bold text-heading">
              {post.authorName}
            </p>

            <p className="m-0 truncate font-body text-[14px] text-neutral-500">
              {post.authorRole}
            </p>
          </div>

          <span className="ml-auto shrink-0 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
            {post.topic}
          </span>
        </div>

        <h2 className="m-0 mt-md min-h-[2.4em] text-left font-heading text-h5 font-bold leading-tight text-heading line-clamp-2">
          {post.title}
        </h2>

        <p className="m-0 mt-xs min-h-[4.8em] line-clamp-3 break-words text-left font-body text-body-sm leading-[1.6] text-body-text">
          {post.content}
        </p>
      </div>

      <footer className="relative z-10 flex items-center gap-lg border-t border-neutral-100 px-lg py-md">
        <LikeControl
          isInteractive={isInteractive}
          isLiked={isLiked}
          likeCount={likeCount}
          onToggle={() => onToggleLike(post.id)}
        />

        <CommentsControl
          commentCount={commentCount}
          onOpenComments={onOpenComments ? () => onOpenComments(post.id) : undefined}
        />

        {(onEdit || onDelete) && (
          <div className="ml-auto flex items-center gap-xs">
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(post.id)
                }}
                aria-label={`${t('adminForum.edit')} — ${post.title}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-green-500 text-green-500 transition hover:bg-green-50"
              >
                <PencilIcon size={15} aria-hidden="true" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(post.id)
                }}
                aria-label={`${t('adminForum.delete')} — ${post.title}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-danger transition hover:bg-red-50"
              >
                <Trash2Icon size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </footer>
    </article>
  )
}

export default BlogPostCard
