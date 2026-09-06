interface MultimediaCardProps {
  imageSrc: string
  alt: string
  badge: string
  title: string
  description: string
}

function MultimediaCard({ imageSrc, alt, badge, title, description }: MultimediaCardProps) {
  return (
    <article className="rounded-3xl bg-white shadow">
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

      <div className="px-lg pb-lg text-left">
        <h3 className="m-0 font-heading text-h5 font-bold text-heading">
          {title}
        </h3>
        <p className="mt-sm font-body text-body-sm font-normal leading-[1.5] text-body-text-dark">
          {description}
        </p>
      </div>
    </article>
  )
}

export default MultimediaCard