import React from 'react'
import { motion } from 'framer-motion'
import { Button, SmartLink as Link } from '@/shared/components'
import { formatIDR } from '@/lib/utils'
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
      className="border border-neutral-200 p-5 sm:p-6 bg-white hover:border-neutral-400 transition duration-200 rounded-none hover:shadow-sm"
    >
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-100 mb-4 text-sm gap-2">
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900">
            No. Pesanan:{' '}
            <Link
              href={`/pesanan/${order.order_number}`}
              className="underline hover:text-neutral-600"
            >
              {order.order_number}
            </Link>
          </p>
          <p className="text-xs text-neutral-400">
            Tanggal:{' '}
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Items preview */}
      <div className="space-y-3 mb-5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <div className="min-w-0 pr-4">
              <p className="font-medium text-neutral-800 truncate">
                {item.product_name} - {item.variant_name}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {item.quantity} x {formatIDR(item.price)}
              </p>
            </div>
            <span className="font-semibold text-neutral-900 whitespace-nowrap">
              {formatIDR(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Total amount & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-neutral-100 gap-4">
        <div className="text-sm">
          <span className="text-neutral-500">Total Pembayaran:</span>{' '}
          <span className="font-bold text-neutral-900 text-base">
            {formatIDR(order.total_amount)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/pesanan/${order.order_number}`}>
            <Button variant="outline" className="text-xs py-2 px-4 uppercase font-semibold">
              Lihat Detail
            </Button>
          </Link>

          {order.status === 'pending_payment' && (
            <>
              <Button
                variant="outline"
                onClick={() => onCancelOrder(order.id, order.order_number)}
                className="text-xs py-2 px-4 uppercase font-semibold border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
              >
                Batalkan
              </Button>
              <Button
                onClick={() => onPayOrder(order.order_number)}
                className="text-xs py-2 px-4 uppercase font-semibold"
              >
                Bayar Sekarang
              </Button>
            </>
          )}

          {order.status === 'shipped' && (
            <Button
              onClick={() => onConfirmDelivery(order.id, order.order_number)}
              className="text-xs py-2 px-4 uppercase font-semibold"
            >
              Selesai (Terima Barang)
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
