import Skeleton from '../ui/Skeleton.tsx'

interface MultimediaCardProps {
  imageSrc?: string
  alt?: string
  badge?: string
  title?: string
  description?: string
  onClick?: () => void
  loading?: boolean
}

function MultimediaCard({ imageSrc, alt, badge, title, description, onClick, loading = false }: Readonly<MultimediaCardProps>) {
  if (loading) {
    return (
      <article className="flex h-full flex-col rounded-3xl bg-white shadow">
        <div className="m-sm overflow-hidden rounded-[20px]">
          <Skeleton shape="rect" className="aspect-[4/3] w-full" />
        </div>
        <div className="flex flex-col gap-sm px-lg pb-lg text-left">
          <Skeleton shape="line" className="h-5 w-4/5" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />
        </div>
      </article>
    )
  }

  const contenido = (
    <>
      <div className="relative m-sm overflow-hidden rounded-[20px]">
        <img
          src={imageSrc}
          alt={alt}
          className="block aspect-[4/3] w-full object-cover"
        />
        <span className="absolute bottom-sm left-sm rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white shadow">
          {badge}
        </span>
      </div>

      <div className="flex flex-col px-lg pb-lg text-left">
        <h3 className="m-0 line-clamp-2 min-h-[2.8em] font-heading text-h4 font-bold text-heading">
          {title}
        </h3>
        <p className="-mt-sm line-clamp-5 min-h-[7.5em] font-body text-body-sm font-normal leading-[1.5] text-body-text-dark">
          {description}
        </p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col rounded-3xl bg-white text-left shadow cursor-pointer transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2"
      >
        {contenido}
      </button>
    )
  }

  return (
    <article className="flex h-full flex-col rounded-3xl bg-white shadow">
      {contenido}
    </article>
  )
}

export default MultimediaCard
