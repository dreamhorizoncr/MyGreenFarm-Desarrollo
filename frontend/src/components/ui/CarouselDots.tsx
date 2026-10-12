/** Puntos de navegación de carruseles (testimonios, visor de fotos): uno por elemento, el activo en verde */

interface CarouselDotsProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
  ariaLabel: string
  // Texto accesible de cada punto, p. ej. "Ir a la foto 3".
  getItemLabel: (index: number) => string
  className?: string
}

function CarouselDots({ count, activeIndex, onSelect, ariaLabel, getItemLabel, className = '' }: Readonly<CarouselDotsProps>) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={ariaLabel}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={getItemLabel(index)}
          aria-current={index === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className={`size-2 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green-500)] ${index === activeIndex ? 'scale-125 bg-[var(--green-500)]' : 'bg-[var(--grey-300)]'}`}
        />
      ))}
    </div>
  )
}

export default CarouselDots
