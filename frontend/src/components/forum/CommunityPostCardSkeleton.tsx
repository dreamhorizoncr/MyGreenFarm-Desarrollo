import Skeleton from '../ui/Skeleton.tsx'

function CommunityPostCardSkeleton() {
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
    </article>
  )
}

export default CommunityPostCardSkeleton
