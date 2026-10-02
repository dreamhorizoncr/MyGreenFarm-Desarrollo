import Skeleton from '../ui/Skeleton.tsx'

interface BlogPostCardSkeletonProps {
  isAdmin?: boolean
}

function BlogPostCardSkeleton({ isAdmin = false }: Readonly<BlogPostCardSkeletonProps>) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left">
      <Skeleton shape="rect" className="h-[160px] w-full rounded-none xs:h-[220px]" />

      <div className="flex-1 p-lg">
        <div className="flex items-center gap-md">
          <Skeleton shape="circle" className="size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-3 w-1/3" />
            <Skeleton shape="line" className="mt-xs h-3 w-1/4" />
          </div>
        </div>

        <Skeleton shape="line" className="mt-md h-5 w-4/5" />
        <Skeleton shape="line" className="mt-xs h-4 w-full" />
        <Skeleton shape="line" className="mt-2xs h-4 w-2/3" />
      </div>

      <div className="flex items-center gap-lg border-t border-neutral-100 px-lg py-md">
        <Skeleton shape="line" className="h-4 w-10" />
        <Skeleton shape="line" className="h-4 w-10" />

        {isAdmin && (
          <div className="ml-auto flex items-center gap-xs">
            <Skeleton shape="circle" className="h-9 w-9" />
            <Skeleton shape="circle" className="h-9 w-9" />
          </div>
        )}
      </div>
    </article>
  )
}

export default BlogPostCardSkeleton
