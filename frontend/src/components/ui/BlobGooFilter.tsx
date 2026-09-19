function BlobGooFilter() {
  return (
    <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <filter id="blob-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
        </filter>
      </defs>
    </svg>
  )
}

export default BlobGooFilter
