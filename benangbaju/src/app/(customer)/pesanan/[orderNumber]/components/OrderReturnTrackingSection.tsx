'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { HandDrawnIcon, SmartLink as Link } from '@/shared/components'
import { formatIDR } from '@/lib/utils'

interface OrderReturnTrackingSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnRequest: any
  orderNumber: string
}

export function OrderReturnTrackingSection({
  returnRequest,
  orderNumber,
}: OrderReturnTrackingSectionProps): React.JSX.Element | null {
  if (!returnRequest) return null

  const steps = [
    { id: 'pending', label: 'Pengajuan Retur Dikirim', icon: <HandDrawnIcon name="clock" className="h-4 w-4" /> },
    { id: 'approved', label: 'Retur Disetujui', icon: <HandDrawnIcon name="check-circle" className="h-4 w-4" /> },
    { id: 'completed', label: 'Dana Dikembalikan', icon: <HandDrawnIcon name="refresh" className="h-4 w-4" /> },
  ]

  const status = returnRequest.status || 'pending'
  const isRejected = status === 'rejected'

  const statusIndexMap: Record<string, number> = {
    pending: 0,
    approved: 1,
    completed: 2,
  }

  const currentStepIndex = isRejected ? 0 : statusIndexMap[status] ?? 0

  return (
    <div className="border border-brand-gold/80 p-6 bg-brand-cream rounded-2xl space-y-6 shadow-xs font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-300 to-brand-gold" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HandDrawnIcon name="refresh" className="h-4 w-4 text-brand-plum" />
          <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum">
            Status Pengajuan Retur Barang
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${
              isRejected
                ? 'bg-red-100 text-red-700 border border-red-200'
                : status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : status === 'approved'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span>
              {isRejected
                ? 'Retur Ditolak'
                : status === 'completed'
                  ? 'Retur Selesai'
                  : status === 'approved'
                    ? 'Retur Disetujui'
                    : 'Menunggu Peninjauan Admin'}
            </span>
          </span>

          <Link
            href={`/pesanan/${orderNumber}/retur`}
            className="text-[10px] uppercase tracking-wider font-bold text-brand-plum hover:text-brand-blue underline underline-offset-2 transition"
          >
            Detail Retur
          </Link>
        </div>
      </div>

      {isRejected ? (
        <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl space-y-1.5 text-xs text-red-800 font-sans">
          <div className="flex items-center space-x-2 font-bold">
            <HandDrawnIcon name="alert-triangle" className="h-4 w-4 shrink-0 text-red-600" />
            <span>Pengajuan Retur Ditolak oleh Admin</span>
          </div>
          {returnRequest.admin_notes && (
            <p className="text-red-700 font-medium leading-relaxed pl-6">
              Alasan Penolakan: {returnRequest.admin_notes}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Stepper Timeline */}
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 pt-2">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex
              const isActive = idx === currentStepIndex

              return (
                <div key={step.id} className="flex md:flex-col items-center flex-1 w-full relative z-10">
                  <div
                    className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-brand-gold border-brand-gold text-brand-plum font-bold shadow-xs'
                        : 'bg-brand-cream border-neutral-200 text-neutral-400'
                    } ${isActive ? 'ring-4 ring-brand-gold/40 scale-110' : ''}`}
                  >
                    {step.icon}
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-brand-gold/30 -z-10"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>

                  <span
                    className={`ml-4 md:ml-0 md:mt-3 text-xs font-sans uppercase tracking-wider whitespace-nowrap text-center ${
                      isActive || isCompleted ? 'text-brand-plum font-bold' : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-4 left-[50%] right-[-50%] -z-10">
                      <div className="w-full border-t-2 border-dashed border-neutral-300 relative">
                        <motion.div
                          className="border-t-2 border-dashed border-brand-gold absolute top-[-2px] left-0 h-0"
                          initial={{ width: idx < currentStepIndex ? '100%' : '0%' }}
                          animate={{ width: idx < currentStepIndex ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Refund Details Summary */}
          <div className="bg-white/80 p-4 rounded-xl border border-neutral-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2">
            <div>
              <span className="text-neutral-500 font-medium block">Rekening Pengembalian:</span>
              <span className="font-bold text-brand-plum">
                {returnRequest.refund_bank_name} - {returnRequest.refund_account_number} ({returnRequest.refund_account_name})
              </span>
            </div>
            {returnRequest.refund_amount && (
              <div className="sm:text-right">
                <span className="text-neutral-500 font-medium block">Nominal Refund:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatIDR(returnRequest.refund_amount)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
