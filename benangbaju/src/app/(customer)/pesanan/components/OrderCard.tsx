import React from 'react'
import { motion } from 'framer-motion'
import { Button, SmartLink as Link } from '@/shared/components'
import { formatIDR, formatDate } from '@/lib/utils'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderItem {
  id: string
  product_name: string
  variant_name: string
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  status: string
  created_at: string
  total_amount: number
  order_items: OrderItem[]
}

interface OrderCardProps {
  order: Order
  index: number
  onCancelOrder: (id: string, number: string) => void
  onPayOrder: (number: string) => void
  onConfirmDelivery: (id: string, number: string) => void
}

export function OrderCard({
  order,
  index,
  onCancelOrder,
  onPayOrder,
  onConfirmDelivery,
}: OrderCardProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="border border-neutral-200/80 p-5 sm:p-6 bg-brand-cream transition-all duration-300 rounded-2xl shadow-xs hover:shadow-md font-sans"
    >
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-200/60 mb-4 text-sm gap-2">
        <div className="space-y-1">
          <p className="font-bold text-brand-plum">
            No. Pesanan:{' '}
            <Link
              href={`/pesanan/${order.order_number}`}
              className="underline hover:text-brand-blue"
            >
              {order.order_number}
            </Link>
          </p>
          <p className="text-xs text-neutral-500 font-sans">
            Tanggal: {formatDate(order.created_at)}
          </p>
        </div>
        <div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Items preview */}
      <div className="space-y-3 mb-5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm font-sans">
            <div className="min-w-0 pr-4">
              <p className="font-bold text-brand-plum truncate">
                {item.product_name} - {item.variant_name}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {item.quantity} x {formatIDR(item.price)}
              </p>
            </div>
            <span className="font-bold text-brand-plum whitespace-nowrap">
              {formatIDR(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Total amount & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-neutral-200/60 gap-4 font-sans">
        <div className="text-sm">
          <span className="text-neutral-500">Total Pembayaran:</span>{' '}
          <span className="font-bold text-brand-plum text-base">
            {formatIDR(order.total_amount)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/pesanan/${order.order_number}`}>
            <Button variant="outline" className="text-xs py-2 px-4 uppercase font-bold">
              Lihat Detail
            </Button>
          </Link>

          {order.status === 'pending_payment' && (
            <>
              <Button
                variant="outline"
                onClick={() => onCancelOrder(order.id, order.order_number)}
                className="text-xs py-2 px-4 uppercase font-bold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Batalkan
              </Button>
              <Button
                variant="accent"
                onClick={() => onPayOrder(order.order_number)}
                className="text-xs py-2 px-4 uppercase font-bold"
              >
                Bayar Sekarang
              </Button>
            </>
          )}

          {order.status === 'shipped' && (
            <Button
              variant="accent"
              onClick={() => onConfirmDelivery(order.id, order.order_number)}
              className="text-xs py-2 px-4 uppercase font-bold"
            >
              Selesai (Terima Barang)
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
