type CardColor = 'orange' | 'green' | 'pink'

interface TestimonialCardProps {
  color?: CardColor
  quote: string
  author: string
  initials: string
}

const backgrounds: Record<CardColor, string> = {
  orange: 'bg-[var(--orange-500)]',
  green: 'bg-[var(--green-500)]',
  pink: 'bg-[var(--accent-pink)]',
}

function TestimonialCard({ color = 'orange', quote, author, initials }: Readonly<TestimonialCardProps>) {
  return (
    <figure className={`relative flex min-h-64 flex-col justify-center rounded-3xl ${backgrounds[color]} p-xl text-left`}>
      <blockquote className="flex flex-1 flex-col justify-between">
        <p className="font-body text-body-sm font-normal text-white">
          {quote}
        </p>
        <figcaption className="mt-lg flex items-center gap-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white font-heading text-body-text-dark">
            {initials}
          </span>
          <span className="font-body text-body-sm font-semibold text-white">{author}</span>
        </figcaption>
      </blockquote>
      <span
        aria-hidden="true"
        className={`absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 ${backgrounds[color]}`}
      />
    </figure>
  )
}

export default TestimonialCard
