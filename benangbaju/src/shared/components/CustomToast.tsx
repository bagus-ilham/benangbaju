import React from 'react'
import Image from 'next/image'
import toast, { Toast } from 'react-hot-toast'
import { getProxiedImageUrl } from '@/lib/getImageUrl'
import { cn } from '@/lib/utils'

interface CustomToastProps {
  t: Toast
  title: string
  subtitle: string
  description?: string
  imageUrl?: string | null
  actionLabel?: string
  onAction?: () => void
}

export function CustomToast({
  t,
  title,
  subtitle,
  description,
  imageUrl,
  actionLabel,
  onAction,
}: CustomToastProps): React.JSX.Element {
  return (
    <div
      className={cn(
        t.visible ? 'animate-enter' : 'animate-leave',
        'relative max-w-sm w-full bg-brand-cream shadow-[0_20px_40px_-15px_rgba(45,38,64,0.22)] border border-brand-plum/10 rounded-2xl flex pointer-events-auto overflow-hidden'
      )}
    >
      {/* Top pastel accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-blue via-brand-blush to-brand-gold"
        aria-hidden="true"
      />
      <div className="flex-1 w-0 p-4 pt-4.5">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {imageUrl ? (
              <div className="relative aspect-[3/4] w-10 bg-brand-rose-soft/65 border border-brand-plum/10 rounded-xl overflow-hidden">
                <Image
                  className="object-cover"
                  src={getProxiedImageUrl(imageUrl)}
                  alt={subtitle}
                  fill
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="h-10 w-10 bg-brand-rose-soft/65 border border-brand-plum/10 rounded-xl flex items-center justify-center text-[8px] text-brand-plum/50 font-sans">
                No Img
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-accent font-bold text-brand-blue leading-none">
              {title}
            </p>
            <p className="text-sm font-serif font-medium text-brand-plum line-clamp-1 mt-1 leading-snug">
              {subtitle}
            </p>
            {description && (
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actionLabel && onAction && (
        <div className="flex border-l border-brand-plum/10">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id)
              onAction()
            }}
            className="w-full px-4 flex items-center justify-center text-[11px] font-sans font-bold uppercase tracking-wider text-brand-plum hover:bg-brand-gold-soft/60 transition-colors focus:outline-none cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
