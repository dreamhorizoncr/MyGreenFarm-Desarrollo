import type { CSSProperties, PointerEventHandler } from 'react'

// Drawn as inline SVG so hover follows the piece outline, not its bounding box.
interface PieceShape {
  viewBox: string
  d: string
  fill: string
}

const cache = new Map<string, PieceShape>()

function parsePiece(svg: string): PieceShape {
  const cached = cache.get(svg)
  if (cached) return cached
  const shape = {
    viewBox: /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 100 100',
    d: /<path[^>]*\sd="([^"]+)"/.exec(svg)?.[1] ?? '',
    fill: /<path[^>]*\sfill="([^"]+)"/.exec(svg)?.[1] ?? 'currentColor',
  }
  cache.set(svg, shape)
  return shape
}

interface PuzzlePieceProps {
  svg: string
  className?: string
  style?: CSSProperties
  onPointerEnter?: PointerEventHandler<SVGPathElement>
  onPointerLeave?: PointerEventHandler<SVGPathElement>
}

function PuzzlePiece({ svg, className, style, onPointerEnter, onPointerLeave }: Readonly<PuzzlePieceProps>) {
  const { viewBox, d, fill } = parsePiece(svg)
  return (
    <svg className={className} style={style} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path className="puzzle-piece__shape" d={d} fill={fill} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} />
    </svg>
  )
}

export default PuzzlePiece
