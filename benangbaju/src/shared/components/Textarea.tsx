import React, { useId } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id: idProp, rows = 4, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = idProp ?? generatedId
    const errorId = `${textareaId}-error`
    const helperId = `${textareaId}-helper`

    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null].filter(Boolean).join(' ') ||
      undefined

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[10px] uppercase tracking-wider font-heading font-medium text-brand-black/70 transition-colors duration-200"
          >
            {label}
          </label>
        )}

        <div className="relative flex group">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            className={cn(
              // Textarea styles — THENBLANK premium minimalist design
              'w-full bg-white text-xs px-4 py-3 border border-neutral-200 rounded-none text-brand-black transition-all duration-300 placeholder:text-neutral-400 focus:border-brand-black focus:bg-neutral-50/50 focus-ring-premium resize-y min-h-[80px]',
              {
                'border-red-500 focus:border-red-500': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          {/* Animated focus underline */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-black transform scale-x-0 transition-transform duration-300 origin-left group-focus-within:scale-x-100" />
        </div>

        {error && (
          <span id={errorId} className="text-[10px] text-red-500 tracking-wide font-sans">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-[10px] text-neutral-500 tracking-wide font-sans">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
