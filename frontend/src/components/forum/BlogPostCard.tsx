import { useTranslation } from 'react-i18next'
import { HeartIcon, MessageCircleIcon } from '@animateicons/react/lucide'
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
}

function BlogPostCard({
  post,
  commentCount,
  isLiked,
  likeCount,
  onToggleLike,
  onOpen,
  onOpenComments,
}: BlogPostCardProps) {
  const { t } = useTranslation()
  const isInteractive = Boolean(onOpen)

  return (
    <article
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? () => onOpen?.(post.id) : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpen?.(post.id)
              }
            }
          : undefined
      }
      aria-label={isInteractive ? post.title : undefined}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left ${
        isInteractive ? 'cursor-pointer transition hover:opacity-95' : ''
      }`}
    >
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
            <p className="m-0 truncate font-heading text-[14px] font-bold text-heading">
              {post.authorName}
            </p>

            <p className="m-0 truncate font-body text-body-sm text-neutral-500">
              {post.authorRole}
            </p>
          </div>

          <span className="ml-auto shrink-0 rounded-full bg-[var(--info-50)] px-md py-2xs font-body text-body-sm font-semibold text-[var(--info-500)]">
            {post.topic}
          </span>
        </div>

        <h2 className="m-0 mt-md min-h-[2.4em] text-left font-heading text-h5 font-bold leading-tight text-heading line-clamp-2">
          {post.title}
        </h2>

        <p className="m-0 mt-xs min-h-[4.8em] line-clamp-3 break-words text-left font-body text-[15px] leading-[1.6] text-body-text">
          {post.content}
        </p>
      </div>

      <footer className="flex items-center gap-lg border-t border-neutral-100 px-lg py-md">
        {isInteractive ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleLike(post.id)
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
        ) : (
          <span
            aria-label={t('forum.likes.label')}
            className="flex items-center gap-xs font-body text-body-sm text-neutral-500"
          >
            <HeartIcon size={18} aria-hidden="true" />
            <span>{likeCount}</span>
          </span>
        )}

        {onOpenComments ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpenComments(post.id)
            }}
            aria-label={t('forum.blog.commentsTitle')}
            className="flex items-center gap-xs font-body text-body-sm text-neutral-500 hover:text-heading"
          >
            <MessageCircleIcon size={18} />
            <span>{commentCount}</span>
          </button>
        ) : (
          <span
            aria-label={t('forum.blog.commentsTitle')}
            className="flex items-center gap-xs font-body text-body-sm text-neutral-500"
          >
            <MessageCircleIcon size={18} />
            <span>{commentCount}</span>
          </span>
        )}
      </footer>
    </article>
  )
}

export default BlogPostCard
