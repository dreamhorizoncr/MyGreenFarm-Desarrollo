
interface CarouselDotsProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
  ariaLabel: string
  getItemLabel: (index: number) => string
  className?: string
}

function CarouselDots({ count, activeIndex, onSelect, ariaLabel, getItemLabel, className = '' }: Readonly<CarouselDotsProps>) {
  return (
    <div className={`flex items-center ${className}`} aria-label={ariaLabel}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={getItemLabel(index)}
          aria-current={index === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className="inline-flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green-500)]"
        >
          {/* 24 px to tap (WCAG 2.2), the visible dot stays 8 px */}
          <span className={`size-2 rounded-full transition-transform ${index === activeIndex ? 'scale-125 bg-[var(--green-500)]' : 'bg-[var(--grey-300)]'}`} />
        </button>
      ))}
    </div>
  )
}

export default CarouselDots
