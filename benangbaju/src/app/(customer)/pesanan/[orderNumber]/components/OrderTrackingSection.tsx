import React from 'react'
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
    { id: 'processing', label: 'Diproses', icon: <Package size={16} /> },
    { id: 'shipped', label: 'Dikirim', icon: <Truck size={16} /> },
    { id: 'completed', label: 'Selesai', icon: <CheckCircle2 size={16} /> },
  ]

  const statusIndex = steps.findIndex((step) => step.id === status)

  if (status === 'cancelled') {
    return (
      <div className="border border-error-border p-5 bg-error-bg card-hover-lift gold-border-hover">
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
    <div className="border border-neutral-200 p-5 bg-brand-cream/30 card-hover-lift gold-border-hover">
      <p className="text-[10px] uppercase tracking-widest font-heading font-medium text-brand-gold mb-6">
        Status Pesanan
      </p>
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">
        {steps.map((step, idx) => {
          const isCompleted = idx <= statusIndex
          const isActive = idx === statusIndex

          return (
            <div
              key={step.id}
              className="flex md:flex-col items-center flex-1 w-full relative z-10"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition duration-200 ${
                  isCompleted
                    ? 'bg-brand-gold border-brand-gold text-white'
                    : 'bg-white border-neutral-200 text-neutral-400'
                } ${isActive ? 'ring-4 ring-brand-gold/20' : ''}`}
              >
                {step.icon}
              </div>

              <span
                className={`ml-4 md:ml-0 md:mt-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  isActive
                    ? 'text-brand-gold font-bold'
                    : isCompleted
                      ? 'text-brand-black'
                      : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>

              {idx < steps.length - 1 && (
                <div
                  className={`hidden md:block absolute top-4 left-[50%] right-[-50%] h-[2px] transition duration-200 -z-10 ${
                    idx < statusIndex ? 'bg-brand-gold' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
