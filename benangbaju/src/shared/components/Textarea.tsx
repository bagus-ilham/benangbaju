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
            className="text-[10px] uppercase tracking-wider font-sans font-bold text-brand-plum/80 transition-colors duration-200"
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
              // Textarea styles — Modern premium soft design with Brand Guidelines v9 tokens
              'w-full bg-brand-cream text-xs px-4 py-3.5 border border-neutral-200/80 rounded-xl text-brand-plum transition-all duration-300 placeholder:text-neutral-400 focus:bg-brand-cream focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-brand-gold/40 focus:shadow-xs resize-y min-h-[80px] font-sans',
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
