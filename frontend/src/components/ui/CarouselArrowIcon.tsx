function CarouselArrowIcon({ flip = false }: Readonly<{ flip?: boolean }>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-[40%] ${flip ? 'rotate-180' : ''}`}>
      <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export default CarouselArrowIcon
