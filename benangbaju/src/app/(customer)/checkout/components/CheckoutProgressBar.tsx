import React from 'react'
import { motion } from 'framer-motion'
import { SmartLink as Link } from '@/shared/components'

interface CheckoutProgressBarProps {
  checkoutStep: 'shipping' | 'payment'
}

export function CheckoutProgressBar({ checkoutStep }: CheckoutProgressBarProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="list"
      className="flex items-center justify-center space-x-2 md:space-x-4 mb-10 max-w-md mx-auto"
    >
      <Link href="/cart" role="listitem" className="flex items-center space-x-2 group">
        <div className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400 font-sans group-hover:border-brand-black group-hover:text-brand-black transition-colors">
          1
        </div>
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-heading group-hover:text-brand-black transition-colors">
          Keranjang
        </span>
      </Link>
      <div className="w-8 md:w-12 h-px bg-neutral-200" aria-hidden="true" />
      <div
        role="listitem"
        aria-current={checkoutStep === 'shipping' ? 'step' : undefined}
        className="flex items-center space-x-2"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold ${checkoutStep === 'shipping' ? 'bg-brand-gold text-white shadow-[0_0_10px_rgba(154,123,79,0.3)]' : 'border border-neutral-300 text-neutral-400'}`}
        >
          2
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-heading ${checkoutStep === 'shipping' ? 'font-semibold text-brand-gold' : 'text-neutral-400'}`}
        >
          Pengiriman
        </span>
      </div>
      <div className="w-8 md:w-12 h-px bg-neutral-200" aria-hidden="true" />
      <div
        role="listitem"
        aria-current={checkoutStep === 'payment' ? 'step' : undefined}
        className="flex items-center space-x-2"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold ${checkoutStep === 'payment' ? 'bg-brand-gold text-white shadow-[0_0_10px_rgba(154,123,79,0.3)]' : 'border border-neutral-300 text-neutral-400'}`}
        >
          3
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider font-heading ${checkoutStep === 'payment' ? 'font-semibold text-brand-gold' : 'text-neutral-400'}`}
        >
          Pembayaran
        </span>
      </div>
    </motion.div>
  )
}
