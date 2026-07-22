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
        'max-w-sm w-full bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-neutral-200/50 rounded-2xl flex pointer-events-auto overflow-hidden'
      )}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {imageUrl ? (
              <div className="relative aspect-[3/4] w-10 border border-neutral-100 rounded-lg overflow-hidden">
                <Image
                  className="object-cover"
                  src={getProxiedImageUrl(imageUrl)}
                  alt={subtitle}
                  fill
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="h-10 w-10 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 font-sans">
                No Img
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-accent">
              {title}
            </p>
            <p className="text-[11px] font-heading font-medium uppercase text-brand-black line-clamp-1 mt-0.5">
              {subtitle}
            </p>
            {description && (
              <p className="text-[9px] text-neutral-400 uppercase font-sans mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actionLabel && onAction && (
        <div className="flex border-l border-neutral-100">
          <button
            onClick={() => {
              toast.dismiss(t.id)
              onAction()
            }}
            className="w-full border border-transparent rounded-2xl p-4 flex items-center justify-center text-xs font-heading font-bold uppercase tracking-wider text-brand-accent hover:text-brand-accent-light focus:outline-none cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
