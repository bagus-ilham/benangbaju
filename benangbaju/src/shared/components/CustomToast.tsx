import React from 'react'
import Image from 'next/image'
import toast, { Toast } from 'react-hot-toast'

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
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-sm w-full bg-white shadow-2xl border border-neutral-100 flex pointer-events-auto border-t-2 border-t-brand-gold`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {imageUrl ? (
              <div className="relative aspect-[3/4] w-10 border border-neutral-100 overflow-hidden">
                <Image className="object-cover" src={imageUrl} alt={subtitle} fill sizes="40px" />
              </div>
            ) : (
              <div className="h-10 w-10 bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400 font-sans">
                No Img
              </div>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-gold">
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
            className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-xs font-heading font-bold uppercase tracking-wider text-brand-gold hover:text-brand-gold-light focus:outline-none cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
