import { useId } from 'react'

interface ScallopEdgeProps {
  className?: string
}

function ScallopEdge({ className = 'text-green-500' }: Readonly<ScallopEdgeProps>) {
  const patternId = useId()

  return (
    <svg aria-hidden="true" className={`-mt-px block h-[22px] w-full ${className}`}>
      <defs>
        <pattern id={patternId} width="110" height="200" patternUnits="userSpaceOnUse">
          <path fill="currentColor" d="M0 0H110V19C83 19 82 3 55 3S27 19 0 19Z" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

export default ScallopEdge
