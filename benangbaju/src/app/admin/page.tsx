'use client'

import React, { useState } from 'react'
import { useAdminDashboardStats } from '@/app/admin/hooks/useAdmin'
import type { LowStockVariant, RecentOrder, RecentActivityLog } from '@/modules/analytics/actions'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  Button,
  AdminPageHeader,
  AdminStatCard,
  AdminPanel,
  ClientDateTime,
} from '@/shared/components'
import { TrendingUp, ShoppingBag, CheckCircle, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import toast from 'react-hot-toast'

const supabase = createBrowserClient()

export default function AdminDashboardPage(): React.JSX.Element {
  const { data: stats, isLoading, isError, refetch } = useAdminDashboardStats()
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null)
  const [newStockVal, setNewStockVal] = useState<number>(0)

  const handleQuickStockUpdate = (variantId: string, currentStock: number) => {
    setUpdatingStockId(variantId)
    setNewStockVal(currentStock)
  }

  const handleSaveStock = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: newStockVal })
        .eq('id', variantId)

      if (error) throw error

      toast.success('Stok berhasil diperbarui')
      refetch()
    } catch (err) {
      console.error(err)
      toast.error('Gagal memperbarui stok')
    } finally {
      setUpdatingStockId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse font-heading">
          Memuat dashboard...
        </p>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">Gagal memuat data dashboard.</p>
        <Button onClick={() => refetch()} className="mt-4 text-xs uppercase">
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard Ringkasan"
        subtitle="Status dan ringkasan performa toko Anda saat ini."
      >
        <Button
          onClick={() => {
            refetch()
            toast.success('Data diperbarui')
          }}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <RefreshCw size={12} className="mr-1.5" /> Segarkan
        </Button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          label="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
          hint="Dari pesanan dibayar & selesai"
          icon={TrendingUp}
          accent="gold"
        />
        <AdminStatCard
          label="Pesanan Aktif"
          value={stats.activeOrdersCount}
          hint="Diproses & Sedang dikirim"
          icon={ShoppingBag}
        />
        <AdminStatCard
          label="Pesanan Selesai"
          value={stats.completedOrdersCount}
          hint="Transaksi sukses diselesaikan"
          icon={CheckCircle}
          accent="success"
        />
        <AdminStatCard
          label="Total Pelanggan"
          value={stats.customersCount}
          hint="Pengguna terdaftar"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AdminPanel
            title="Peringatan Stok Rendah (< 5)"
            icon={<AlertTriangle size={14} className="text-amber-500" />}
          >
            {stats.lowStockVariants.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">
                Semua varian memiliki stok yang cukup.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produk / Varian</th>
                      <th>SKU</th>
                      <th className="text-center">Stok</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockVariants.map((item: LowStockVariant) => (
                      <tr key={item.id}>
                        <td>
                          <p className="font-semibold text-brand-black">{item.products?.name}</p>
                          <p className="text-[10px] text-neutral-400 font-normal">{item.name}</p>
                        </td>
                        <td className="font-mono">{item.sku || '-'}</td>
                        <td className="text-center">
                          {updatingStockId === item.id ? (
                            <input
                              type="number"
                              className="w-16 px-1.5 py-0.5 border border-neutral-300 outline-none text-center font-bold"
                              value={newStockVal}
                              onChange={(e) =>
                                setNewStockVal(Math.max(0, parseInt(e.target.value) || 0))
                              }
                            />
                          ) : (
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5">
                              {item.stock}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          {updatingStockId === item.id ? (
                            <div className="flex justify-end space-x-1">
                              <Button
                                onClick={() => handleSaveStock(item.id)}
                                className="text-[10px] py-1 px-2.5 font-bold uppercase"
                              >
                                Simpan
                              </Button>
                              <Button
                                onClick={() => setUpdatingStockId(null)}
                                variant="outline"
                                className="text-[10px] py-1 px-2.5 font-bold uppercase border-neutral-200"
                              >
                                Batal
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleQuickStockUpdate(item.id, item.stock)}
                              variant="outline"
                              className="text-[10px] py-1 px-2.5 font-bold uppercase border-neutral-200"
                            >
                              Ubah Stok
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>

          <AdminPanel title="Pesanan Terbaru">
            {stats.recentOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Belum ada pesanan masuk.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order: RecentOrder) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center border-b border-neutral-100 last:border-0 pb-3 last:pb-0 text-xs font-sans"
                  >
                    <div>
                      <Link
                        href="/admin/pesanan"
                        className="font-semibold text-brand-black hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {order.order_shipping?.recipient_name || 'Pelanggan'} |{' '}
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-black">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 mt-1 ${
                          order.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {order.status === 'pending_payment'
                          ? 'Belum Bayar'
                          : order.status === 'processing'
                            ? 'Diproses'
                            : order.status === 'shipped'
                              ? 'Dikirim'
                              : order.status === 'completed'
                                ? 'Selesai'
                                : 'Batal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        <div className="lg:col-span-1">
          <AdminPanel title="Aktivitas Admin Terbaru" className="h-full">
            {stats.recentLogs.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Belum ada log aktivitas.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                {stats.recentLogs.map((log: RecentActivityLog) => (
                  <div
                    key={log.id}
                    className="text-xs space-y-1.5 pb-3 border-b border-neutral-100 last:border-0 last:pb-0 font-sans"
                  >
                    <p className="font-semibold text-neutral-800">
                      {log.profiles?.name || 'Administrator'}
                    </p>
                    <p className="text-neutral-600 leading-relaxed text-[11px]">
                      Melakukan tindakan{' '}
                      <span className="font-semibold text-brand-black font-mono text-[10px] bg-neutral-100 px-1 py-0.5">
                        {log.action}
                      </span>{' '}
                      pada sumber data{' '}
                      <span className="font-semibold text-brand-black">{log.resource_type}</span>{' '}
                      (ID: {log.resource_id || '-'})
                    </p>
                    <p className="text-[10px] text-neutral-400 font-normal">
                      <ClientDateTime
                        date={log.created_at}
                        options={{
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }}
                      />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
