import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface ScallopEdgeProps {
  /** 'down' hangs downward (e.g. below header); 'up' rises upward (e.g. top edge of a section or footer) */
  direction?: 'down' | 'up'
  /** SVG fill color (CSS variable or hex) */
  fill: string
  /** Optional subtle contour stroke along the scalloped arc */
  stroke?: string
  strokeOpacity?: number
  /** Width of each repeating scallop arch in px */
  tileWidth?: number
  /** Total height of the scallop strip in px */
  height?: number
  className?: string
}

export function ScallopEdge({
  direction = 'down',
  fill,
  stroke,
  strokeOpacity = 0.65,
  tileWidth = 56,
  height = 24,
  className,
}: ScallopEdgeProps): React.JSX.Element {
  const rawId = useId()
  const patternId = `benangbaju-scallop-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  const rx = tileWidth / 2
  const ry = Math.max(height - 1.5, 4)

  const fillPath =
    direction === 'down'
      ? `M0 0 H${tileWidth} V1 A${rx} ${ry} 0 0 1 0 1 Z`
      : `M0 ${height} H${tileWidth} V${height - 1} A${rx} ${ry} 0 0 0 0 ${height - 1} Z`

  const strokePath =
    direction === 'down'
      ? `M0 1 A${rx} ${ry} 0 0 0 ${tileWidth} 1`
      : `M0 ${height - 1} A${rx} ${ry} 0 0 1 ${tileWidth} ${height - 1}`

  return (
    <div
      className={cn('w-full overflow-hidden leading-none select-none pointer-events-none', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <svg className="w-full h-full block" preserveAspectRatio="none">
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={tileWidth}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path d={fillPath} fill={fill} />
            {stroke && (
              <path
                d={strokePath}
                fill="none"
                stroke={stroke}
                strokeOpacity={strokeOpacity}
                strokeWidth="1"
              />
            )}
          </pattern>
        </defs>
        <rect width="100%" height={height} fill={`url(#${patternId})`} />
      </svg>
    </div>
  )
}
