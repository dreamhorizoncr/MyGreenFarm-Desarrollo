interface MultimediaCardProps {
  imageSrc: string
  alt: string
  badge: string
  title: string
  description: string
  onClick?: () => void
}

function MultimediaCard({ imageSrc, alt, badge, title, description, onClick }: Readonly<MultimediaCardProps>) {
  const contenido = (
    <>
      <div className="relative m-sm overflow-hidden rounded-[20px]">
        <img
          src={imageSrc}
          alt={alt}
          className="block aspect-[4/3] w-full object-cover"
        />
        <span className="absolute bottom-sm left-sm rounded-full bg-[var(--orange-500)] px-md py-xs font-body text-body-sm font-bold text-white shadow">
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