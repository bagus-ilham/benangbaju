import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react'

interface OrderTrackingSectionProps {
  status: string
  cancelReason?: string | null
}

export function OrderTrackingSection({
  status,
  cancelReason,
}: OrderTrackingSectionProps): React.JSX.Element {
  const steps = [
    { id: 'pending_payment', label: 'Menunggu Pembayaran', icon: <Clock size={16} /> },
    { id: 'processing', label: 'Diproses Seller', icon: <Package size={16} /> },
    { id: 'shipped', label: 'Dalam Pengiriman', icon: <Truck size={16} /> },
    { id: 'completed', label: 'Pesanan Selesai', icon: <CheckCircle2 size={16} /> },
  ]

  const statusIndex = steps.findIndex((step) => step.id === status)

  if (status === 'cancelled') {
    return (
      <div className="border border-error-border p-5 bg-error-bg card-hover-lift rounded-2xl">
        <p className="text-[10px] uppercase tracking-widest font-heading font-medium text-error mb-4">
          Status Pesanan
        </p>
        <div className="flex items-center space-x-3 text-error text-xs font-semibold">
          <XCircle size={18} />
          <div>
            <p className="font-bold uppercase tracking-wider text-xs">Pesanan Dibatalkan</p>
            {cancelReason && (
              <p className="font-normal text-error/80 mt-1">Alasan: {cancelReason}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-neutral-200/80 p-6 bg-brand-cream rounded-2xl space-y-6 shadow-xs font-sans">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum">
          Pelacakan Pesanan Live
        </p>
        {statusIndex >= 0 && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-blue/20 border border-brand-blue/40 rounded-full text-[10px] font-sans font-bold text-brand-plum uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-plum animate-ping" />
            <span>{steps[statusIndex]?.label}</span>
          </span>
        )}
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 pt-2">
        {steps.map((step, idx) => {
          const isCompleted = idx <= statusIndex
          const isActive = idx === statusIndex

          return (
            <div
              key={step.id}
              className="flex md:flex-col items-center flex-1 w-full relative z-10"
            >
              <div
                className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${isCompleted
                    ? 'bg-brand-blue border-brand-blue text-brand-plum font-bold shadow-xs'
                    : 'bg-brand-cream border-neutral-200 text-neutral-400'
                  } ${isActive ? 'ring-4 ring-brand-blue/40 scale-110' : ''}`}
              >
                {step.icon}
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-brand-blue/30 -z-10"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>

              <span
                className={`ml-4 md:ml-0 md:mt-3 text-xs font-sans uppercase tracking-wider whitespace-nowrap text-center ${isActive
                    ? 'text-brand-plum font-bold'
                    : isCompleted
                      ? 'text-brand-plum font-bold'
                      : 'text-neutral-400'
                  }`}
              >
                {step.label}
              </span>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-4 left-[50%] right-[-50%] -z-10">
                  <div className="w-full border-t-2 border-dashed border-neutral-300 relative">
                    <motion.div
                      className="border-t-2 border-dashed border-brand-blue absolute top-[-2px] left-0 h-0"
                      initial={{ width: idx < statusIndex ? '100%' : '0%' }}
                      animate={{ width: idx < statusIndex ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
