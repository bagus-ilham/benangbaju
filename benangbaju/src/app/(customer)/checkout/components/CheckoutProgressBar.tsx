import React from 'react'
import { motion } from 'framer-motion'
import { SmartLink as Link } from '@/shared/components'
import { Check } from 'lucide-react'

interface CheckoutProgressBarProps {
  checkoutStep: 'shipping' | 'payment'
}

export function CheckoutProgressBar({ checkoutStep }: CheckoutProgressBarProps): React.JSX.Element {
  const isShippingDone = checkoutStep === 'payment'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="list"
      className="flex items-center justify-center space-x-2 md:space-x-4 mb-10 max-w-md mx-auto px-4 py-3 bg-brand-cream border border-neutral-200/80 rounded-full shadow-xs"
    >
      <Link href="/cart" role="listitem" className="flex items-center space-x-2 group">
        <div className="w-5 h-5 rounded-full bg-brand-plum text-brand-cream flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-110">
          <Check size={10} strokeWidth={3} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-brand-plum font-sans font-bold transition-colors">
          Keranjang
        </span>
      </Link>

      <div
        className="relative w-8 md:w-12 h-0.5 bg-neutral-200/80 overflow-hidden rounded-full"
        aria-hidden="true"
      >
        <motion.div
          className="h-full bg-brand-blue"
          initial={{ width: '100%' }}
          animate={{ width: '100%' }}
        />
      </div>

      <div
        role="listitem"
        aria-current={checkoutStep === 'shipping' ? 'step' : undefined}
        className="flex items-center space-x-2"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-bold transition-all duration-300 ${isShippingDone ? 'bg-brand-plum text-brand-cream shadow-sm' : checkoutStep === 'shipping' ? 'bg-brand-blue text-brand-plum shadow-sm scale-110' : 'border border-neutral-300 text-neutral-400'}`}
        >
          {isShippingDone ? <Check size={10} strokeWidth={3} /> : '2'}
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-sans transition-colors duration-300 ${isShippingDone ? 'font-bold text-brand-plum' : checkoutStep === 'shipping' ? 'font-bold text-brand-plum' : 'text-neutral-400'}`}
        >
          Pengiriman
        </span>
      </div>

      <div
        className="relative w-8 md:w-12 h-0.5 bg-neutral-200 overflow-hidden rounded-full"
        aria-hidden="true"
      >
        <motion.div
          className="h-full bg-brand-blue"
          initial={{ width: isShippingDone ? '100%' : '0%' }}
          animate={{ width: isShippingDone ? '100%' : '0%' }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div
        role="listitem"
        aria-current={checkoutStep === 'payment' ? 'step' : undefined}
        className="flex items-center space-x-2"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-bold transition-all duration-300 ${checkoutStep === 'payment' ? 'bg-brand-blue text-brand-plum shadow-sm scale-110' : 'border border-neutral-300 text-neutral-400'}`}
        >
          3
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-sans transition-colors duration-300 ${checkoutStep === 'payment' ? 'font-bold text-brand-plum' : 'text-neutral-400'}`}
        >
          Pembayaran
        </span>
      </div>
    </motion.div>
  )
}
