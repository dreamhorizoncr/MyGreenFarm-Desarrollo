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
  onOpen: (postId: string) => void
  onOpenComments: (postId: string) => void
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

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(post.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(post.id)
        }
      }}
      aria-label={post.title}
      className="cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left transition hover:opacity-95"
    >
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.imageAlt ?? ''}
          loading="lazy"
          className="max-h-[160px] w-full object-cover xs:max-h-[220px]"
        />
      )}

      <div className="p-lg">
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

        <h2 className="m-0 mt-md text-left font-heading text-h5 font-bold leading-tight text-heading">
          {post.title}
        </h2>

        <p className="m-0 mt-xs line-clamp-3 text-left font-body text-[15px] leading-[1.6] text-body-text">
          {post.content}
        </p>
      </div>

      <footer className="flex items-center gap-lg border-t border-neutral-100 px-lg py-md">
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
      </footer>
    </article>
  )
}

export default BlogPostCard
