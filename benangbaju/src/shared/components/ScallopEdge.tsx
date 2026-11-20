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

export type SectionEdgeStyle = 'flat' | 'scallop'

export interface SectionBandEdgesProps {
  /** Edge shape along the top boundary of the section ('flat' = crisp box, 'scallop' = upward scallop) */
  topEdge?: SectionEdgeStyle
  /** Edge shape along the bottom boundary of the section ('flat' = crisp box, 'scallop' = downward scallop) */
  bottomEdge?: SectionEdgeStyle
  /** SVG fill matching the section's background color */
  fill: string
  /** Optional subtle contour stroke color */
  stroke?: string
  strokeOpacity?: number
  tileWidth?: number
  height?: number
}

/**
 * DRY helper for full-bleed colored sections to mix crisp flat ("kotak") edges
 * and scalloped ("rumbai") edges consistently without duplicating positioning markup.
 */
export function SectionBandEdges({
  topEdge = 'flat',
  bottomEdge = 'flat',
  fill,
  stroke,
  strokeOpacity = 0.45,
  tileWidth = 56,
  height = 22,
}: SectionBandEdgesProps): React.JSX.Element | null {
  if (topEdge !== 'scallop' && bottomEdge !== 'scallop') return null

  return (
    <>
      {topEdge === 'scallop' && (
        <ScallopEdge
          direction="up"
          fill={fill}
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          tileWidth={tileWidth}
          height={height}
          className="absolute left-0 right-0 bottom-full mb-[-1px] pointer-events-none z-20"
        />
      )}
      {bottomEdge === 'scallop' && (
        <ScallopEdge
          direction="down"
          fill={fill}
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          tileWidth={tileWidth}
          height={height}
          className="absolute left-0 right-0 top-full mt-[-1px] pointer-events-none z-20"
        />
      )}
    </>
  )
}
