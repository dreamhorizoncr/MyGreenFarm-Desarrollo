import { useTranslation } from 'react-i18next'
import { HeartIcon, MessageCircleIcon } from '@animateicons/react/lucide'
import type { CommunityPost } from '../../types/forum.ts'
import PostAvatar from './PostAvatar.tsx'
import Skeleton from '../ui/Skeleton.tsx'

interface CommunityPostCardProps {
  post?: CommunityPost
  onToggleLike?: (postId: string) => void
  onOpenComments?: (postId: string) => void
  loading?: boolean
}

function CommunityPostCard({ post, onToggleLike, onOpenComments, loading = false }: Readonly<CommunityPostCardProps>) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <article className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
        <div className="flex items-center gap-md">
          <Skeleton shape="circle" className="size-8 shrink-0" />
          <Skeleton shape="line" className="h-4 w-1/3" />
        </div>
        <div className="mt-md flex flex-col gap-2xs">
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-4/5" />
        </div>
        <div className="mt-md flex items-center gap-lg border-t border-neutral-100 pt-md">
          <Skeleton shape="line" className="h-4 w-10" />
          <Skeleton shape="line" className="h-4 w-10" />
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg text-left transition hover:-translate-y-1 hover:shadow-lg">
      <header className="flex items-center gap-md">
        <PostAvatar name={post!.name} />

        <p className="m-0 min-w-0 truncate font-heading text-h6 font-bold text-heading">
          {post!.name}
        </p>
      </header>

      <p className="m-0 mt-md whitespace-pre-line break-words font-body text-body-sm leading-[1.6] text-body-text">
        {post!.content}
      </p>
      <div className="mt-md flex items-center gap-lg border-t border-neutral-100 pt-md">
        <button type="button" onClick={() => onToggleLike!(post!.id)} aria-pressed={post!.reacted} aria-label={t('forum.likes.label')} className={`flex items-center gap-xs font-body text-body-sm ${post!.reacted ? 'text-danger' : 'text-neutral-500 hover:text-danger'}`}>
          <HeartIcon size={18} className={post!.reacted ? 'fill-current' : ''} /><span>{post!.likeCount}</span>
        </button>
        <button type="button" onClick={() => onOpenComments!(post!.id)} aria-label={t('forum.blog.commentsTitle')} className="flex items-center gap-xs font-body text-body-sm text-neutral-500 hover:text-heading">
          <MessageCircleIcon size={18} /><span>{post!.commentCount}</span>
        </button>
      </div>
    </article>
  )
}

export default CommunityPostCard
