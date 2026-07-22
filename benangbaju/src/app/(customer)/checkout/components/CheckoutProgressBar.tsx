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
      className="flex items-center justify-center space-x-2 md:space-x-4 mb-10 max-w-md mx-auto px-4 py-3 bg-neutral-50/80 border border-neutral-100 rounded-full shadow-xs"
    >
      <Link href="/cart" role="listitem" className="flex items-center space-x-2 group">
        <div className="w-5 h-5 rounded-full bg-brand-black text-white flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-110">
          <Check size={10} strokeWidth={3} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-brand-black font-heading font-medium transition-colors">
          Keranjang
        </span>
      </Link>

      <div className="relative w-8 md:w-12 h-0.5 bg-neutral-200 overflow-hidden rounded-full" aria-hidden="true">
        <motion.div
          className="h-full bg-brand-black"
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
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold transition-all duration-300 ${isShippingDone ? 'bg-brand-black text-white shadow-sm' : checkoutStep === 'shipping' ? 'bg-brand-accent text-white shadow-[0_0_12px_rgba(163,144,128,0.5)] scale-110' : 'border border-neutral-300 text-neutral-400'}`}
        >
          {isShippingDone ? <Check size={10} strokeWidth={3} /> : '2'}
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-heading transition-colors duration-300 ${isShippingDone ? 'font-medium text-brand-black' : checkoutStep === 'shipping' ? 'font-semibold text-brand-accent' : 'text-neutral-400'}`}
        >
          Pengiriman
        </span>
      </div>

      <div className="relative w-8 md:w-12 h-0.5 bg-neutral-200 overflow-hidden rounded-full" aria-hidden="true">
        <motion.div
          className="h-full bg-brand-accent"
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
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold transition-all duration-300 ${checkoutStep === 'payment' ? 'bg-brand-accent text-white shadow-[0_0_12px_rgba(163,144,128,0.5)] scale-110' : 'border border-neutral-300 text-neutral-400'}`}
        >
          3
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-heading transition-colors duration-300 ${checkoutStep === 'payment' ? 'font-semibold text-brand-accent' : 'text-neutral-400'}`}
        >
          Pembayaran
        </span>
      </div>
    </motion.div>
  )
}

