import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          // Base styles — Modern premium rounded design with Mulish font
          'inline-flex items-center justify-center font-sans font-bold tracking-wide uppercase transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] active:translate-y-0.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:ring-offset-1 select-none',
          {
            // Variants — New Palette Hierarchy: 1. Cream, 2. Kuning (Gold), 3. Biru (Accent), 4. Plum
            'bg-brand-cream text-brand-plum hover:bg-[#eae6df] border border-neutral-300 shadow-sm hover:shadow-md':
              variant === 'primary',
            'bg-brand-gold text-brand-plum hover:bg-[#e8d693] border border-transparent shadow-[0_4px_14px_rgba(243,229,171,0.4)] hover:shadow-[0_6px_20px_rgba(243,229,171,0.5)]':
              variant === 'secondary',
            'bg-brand-blue text-brand-plum hover:bg-[#82a4ab] border border-transparent shadow-[0_4px_14px_rgba(148,178,185,0.3)] hover:shadow-[0_6px_20px_rgba(148,178,185,0.4)]':
              variant === 'accent',
            'bg-brand-plum text-brand-cream hover:bg-[#201b2e] border border-transparent shadow-[0_4px_14px_rgba(45,38,64,0.15)] hover:shadow-[0_6px_20px_rgba(45,38,64,0.25)]':
              variant === 'outline',
            'bg-transparent text-brand-plum hover:bg-brand-cream/80 border border-transparent':
              variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-[0_4px_14px_rgba(220,38,38,0.2)]':
              variant === 'danger',

            // Sizes
            'text-[10px] px-4 py-2 rounded-lg': size === 'sm',
            'text-xs px-6 py-3': size === 'md',
            'text-xs md:text-sm px-8 py-4 rounded-2xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText || 'Memuat...'}</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
