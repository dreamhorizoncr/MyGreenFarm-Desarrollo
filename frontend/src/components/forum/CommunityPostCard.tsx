import { useTranslation } from 'react-i18next'
import { HeartIcon, MessageCircleIcon } from '@animateicons/react/lucide'
import type { CommunityPost } from '../../types/forum.ts'
import PostAvatar from './PostAvatar.tsx'

interface CommunityPostCardProps {
  post: CommunityPost
  onToggleLike: (postId: string) => void
  onOpenComments: (postId: string) => void
}

function CommunityPostCard({ post, onToggleLike, onOpenComments }: Readonly<CommunityPostCardProps>) {
  const { t } = useTranslation()
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <header className="flex items-center gap-md">
        <PostAvatar name={post.name} />

        <p className="m-0 min-w-0 truncate font-heading text-h6 font-bold text-heading">
          {post.name}
        </p>
      </header>

      <p className="m-0 mt-md whitespace-pre-line break-words font-body text-[15px] leading-[1.6] text-body-text">
        {post.content}
      </p>
      <div className="mt-md flex items-center gap-lg border-t border-neutral-100 pt-md">
        <button type="button" onClick={() => onToggleLike(post.id)} aria-pressed={post.reacted} aria-label={t('forum.likes.label')} className={`flex items-center gap-xs font-body text-body-sm ${post.reacted ? 'text-danger' : 'text-neutral-500 hover:text-danger'}`}>
          <HeartIcon size={18} className={post.reacted ? 'fill-current' : ''} /><span>{post.likeCount}</span>
        </button>
        <button type="button" onClick={() => onOpenComments(post.id)} aria-label={t('forum.blog.commentsTitle')} className="flex items-center gap-xs font-body text-body-sm text-neutral-500 hover:text-heading">
          <MessageCircleIcon size={18} /><span>{post.commentCount}</span>
        </button>
      </div>
    </article>
  )
}

export default CommunityPostCard
