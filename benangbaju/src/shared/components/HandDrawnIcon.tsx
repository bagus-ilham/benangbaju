import React from 'react'
import { cn } from '@/lib/utils'

export type HandDrawnIconName =
  | 'heart'
  | 'heart-filled'
  | 'heartFilled'
  | 'search'
  | 'shopping-bag'
  | 'shoppingBag'
  | 'user'
  | 'chevron-right'
  | 'chevronRight'
  | 'chevron-left'
  | 'chevronLeft'
  | 'chevron-down'
  | 'chevronDown'
  | 'chevron-up'
  | 'chevronUp'
  | 'arrow-right'
  | 'arrowRight'
  | 'arrow-left'
  | 'arrowLeft'
  | 'arrow-down'
  | 'arrowDown'
  | 'arrow-up'
  | 'arrowUp'
  | 'close'
  | 'cross'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'truck'
  | 'check-circle'
  | 'checkCircle'
  | 'home'
  | 'grid'
  | 'menu'
  | 'logout'
  | 'eye'
  | 'eye-slash'
  | 'eyeSlash'
  | 'star'
  | 'bell'
  | 'map-pin'
  | 'mapPin'
  | 'measuring-tape'
  | 'measuringTape'
  | 'kancing'
  | 'button'

const ICON_FILE_MAP: Record<string, string> = {
  heart: 'icon-heart.svg',
  'heart-filled': 'icon-heart-filled.svg',
  heartFilled: 'icon-heart-filled.svg',
  search: 'icon-search.svg',
  'shopping-bag': 'icon-shopping-bag.svg',
  shoppingBag: 'icon-shopping-bag.svg',
  user: 'icon-user.svg',
  'chevron-right': 'icon-chevron-right.svg',
  chevronRight: 'icon-chevron-right.svg',
  'chevron-left': 'icon-chevron-left.svg',
  chevronLeft: 'icon-chevron-left.svg',
  'chevron-down': 'icon-chevron-down.svg',
  chevronDown: 'icon-chevron-down.svg',
  'chevron-up': 'icon-chevron-up.svg',
  chevronUp: 'icon-chevron-up.svg',
  'arrow-right': 'icon-arrow-right.svg',
  arrowRight: 'icon-arrow-right.svg',
  'arrow-left': 'icon-arrow-left.svg',
  arrowLeft: 'icon-arrow-left.svg',
  'arrow-down': 'icon-arrow-down.svg',
  arrowDown: 'icon-arrow-down.svg',
  'arrow-up': 'icon-arrow-up.svg',
  arrowUp: 'icon-arrow-up.svg',
  close: 'icon-close.svg',
  cross: 'icon-close.svg',
  plus: 'icon-plus.svg',
  minus: 'icon-minus.svg',
  trash: 'icon-trash.svg',
  truck: 'icon-truck.svg',
  'check-circle': 'icon-check-circle.svg',
  checkCircle: 'icon-check-circle.svg',
  home: 'icon-home.svg',
  grid: 'icon-grid.svg',
  menu: 'icon-menu.svg',
  logout: 'icon-logout.svg',
  eye: 'icon-eye.svg',
  'eye-slash': 'icon-eye-slash.svg',
  eyeSlash: 'icon-eye-slash.svg',
  star: 'icon-star.svg',
  bell: 'icon-bell.svg',
  'map-pin': 'icon-map-pin.svg',
  mapPin: 'icon-map-pin.svg',
  'measuring-tape': 'icon-measuring-tape.svg',
  measuringTape: 'icon-measuring-tape.svg',
  kancing: 'icon-kancing.svg',
  button: 'icon-kancing.svg',
}

export interface HandDrawnIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: HandDrawnIconName
  size?: number | string
  className?: string
  alt?: string
}

export const HandDrawnIcon: React.FC<HandDrawnIconProps> = ({
  name,
  size,
  className,
  alt,
  style,
  ...props
}) => {
  const fileName = ICON_FILE_MAP[name]
  if (!fileName) {
    console.warn(`HandDrawnIcon: unknown icon name "${name}"`)
    return null
  }

  const src = `/svg/${fileName}`
  const iconAlt = alt || `${name} icon`

  const dimensionStyle: React.CSSProperties = {}
  if (size) {
    const sizePx = typeof size === 'number' ? `${size}px` : size
    dimensionStyle.width = sizePx
    dimensionStyle.height = sizePx
  }

  return (
    <img
      src={src}
      alt={iconAlt}
      className={cn('inline-block object-contain select-none shrink-0', className)}
      style={{ ...dimensionStyle, ...style }}
      {...props}
    />
  )
}
