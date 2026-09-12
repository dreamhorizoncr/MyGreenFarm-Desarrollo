import type { KeyboardEvent } from 'react'

interface MultimediaCardProps {
  imageSrc: string
  alt: string
  badge: string
  title: string
  description: string
  onClick?: () => void
}

function MultimediaCard({ imageSrc, alt, badge, title, description, onClick }: MultimediaCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={`flex h-full flex-col rounded-3xl bg-white shadow ${onClick ? 'cursor-pointer transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2' : ''}`}
    >
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

      <div className="flex flex-1 flex-col px-lg pb-lg text-left">
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