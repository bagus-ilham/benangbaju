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
              // Textarea styles — Modern premium soft design
              'w-full bg-neutral-50 text-xs px-4 py-3.5 border border-neutral-200 rounded-xl text-brand-black transition-all duration-300 placeholder:text-neutral-400 focus:bg-white focus:border-brand-accent/50 focus:outline-none focus:ring-4 focus:ring-brand-accent/10 focus:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] resize-y min-h-[80px]',
              {
                'border-red-500 focus:border-red-500 focus:ring-red-500/10': error,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />
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
