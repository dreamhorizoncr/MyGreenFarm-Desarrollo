import type { CommunityPost } from '../../types/forum.ts'
import PostAvatar from './PostAvatar.tsx'

interface CommunityPostCardProps {
  post: CommunityPost
}

function CommunityPostCard({ post }: Readonly<CommunityPostCardProps>) {
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
    </article>
  )
}

export default CommunityPostCard
