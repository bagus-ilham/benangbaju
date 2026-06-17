'use client'

import React, { useState } from 'react'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { TrendingUp, ShoppingBag, CheckCircle, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createBrowserClient()

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useAdminDashboard()
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null)
  const [newStockVal, setNewStockVal] = useState<number>(0)

  const handleQuickStockUpdate = async (variantId: string, currentStock: number) => {
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
    } catch (err: any) {
      console.error(err)
      toast.error('Gagal memperbarui stok')
    } finally {
      setUpdatingStockId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat dashboard...</p>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">Gagal memuat data dashboard.</p>
        <Button onClick={() => refetch()} className="mt-4 text-xs uppercase">Coba Lagi</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-neutral-900 tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-xs text-neutral-400 mt-1">Status dan ringkasan performa toko Anda saat ini.</p>
        </div>
        <Button
          onClick={() => {
            refetch()
            toast.success('Data diperbarui')
          }}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <RefreshCw size={12} className="mr-1.5 animate-spin-hover" /> Segarkan
        </Button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="border border-neutral-200 bg-white p-5 rounded-none space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Total Pendapatan</span>
            <TrendingUp size={16} className="text-neutral-700" />
          </div>
          <p className="text-2xl font-serif font-semibold text-neutral-900">
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-neutral-400">Dari pesanan dibayar & selesai</p>
        </div>

        {/* Card 2: Active Orders */}
        <div className="border border-neutral-200 bg-white p-5 rounded-none space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Pesanan Aktif</span>
            <ShoppingBag size={16} className="text-neutral-700" />
          </div>
          <p className="text-2xl font-serif font-semibold text-neutral-900">
            {stats.activeOrdersCount}
          </p>
          <p className="text-[10px] text-neutral-400">Diproses & Sedang dikirim</p>
        </div>

        {/* Card 3: Completed Orders */}
        <div className="border border-neutral-200 bg-white p-5 rounded-none space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Pesanan Selesai</span>
            <CheckCircle size={16} className="text-neutral-700" />
          </div>
          <p className="text-2xl font-serif font-semibold text-neutral-900">
            {stats.completedOrdersCount}
          </p>
          <p className="text-[10px] text-neutral-400">Transaksi sukses diselesaikan</p>
        </div>

        {/* Card 4: Customers */}
        <div className="border border-neutral-200 bg-white p-5 rounded-none space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Total Pelanggan</span>
            <Users size={16} className="text-neutral-700" />
          </div>
          <p className="text-2xl font-serif font-semibold text-neutral-900">
            {stats.customersCount}
          </p>
          <p className="text-[10px] text-neutral-400">Pengguna terdaftar</p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Orders & Stock Mutator */}
        <div className="lg:col-span-2 space-y-8">
          {/* Low Stock Warning */}
          <div className="border border-neutral-200 bg-white p-5 rounded-none">
            <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3 mb-4">
              <AlertTriangle size={15} className="text-amber-500" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-900">
                Peringatan Stok Rendah (&lt; 5)
              </h3>
            </div>
            
            {stats.lowStockVariants.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Semua varian memiliki stok yang cukup.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Produk / Varian</th>
                      <th className="py-2.5">SKU</th>
                      <th className="py-2.5 text-center">Stok</th>
                      <th className="py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                    {stats.lowStockVariants.map((item: any) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="py-3">
                          <p className="text-neutral-900">{item.products?.name}</p>
                          <p className="text-[10px] text-neutral-400 font-normal">{item.name}</p>
                        </td>
                        <td className="py-3 font-mono">{item.sku}</td>
                        <td className="py-3 text-center">
                          {updatingStockId === item.id ? (
                            <input
                              type="number"
                              className="w-16 px-1.5 py-0.5 border border-neutral-300 outline-none text-center font-bold"
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                          ) : (
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 select-all">
                              {item.stock}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
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
          </div>

          {/* Recent Orders */}
          <div className="border border-neutral-200 bg-white p-5 rounded-none">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
              Pesanan Terbaru
            </h3>
            
            {stats.recentOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Belum ada pesanan masuk.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center border-b border-neutral-100 last:border-0 pb-3 last:pb-0 text-xs font-sans">
                    <div>
                      <Link href={`/admin/pesanan`} className="font-semibold text-neutral-900 hover:underline">
                        {order.order_number}
                      </Link>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {order.order_shipping?.recipient_name || 'Pelanggan'} |{' '}
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </p>
                      <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 mt-1 rounded-none ${
                        order.status === 'completed'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : order.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}>
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
          </div>
        </div>

        {/* Right Column: Activity Logs */}
        <div className="lg:col-span-1">
          <div className="border border-neutral-200 bg-white p-5 rounded-none h-full space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-900 border-b border-neutral-100 pb-3">
              Aktivitas Admin Terbaru
            </h3>
            
            {stats.recentLogs.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">Belum ada log aktivitas.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                {stats.recentLogs.map((log: any) => (
                  <div key={log.id} className="text-xs space-y-1.5 pb-3 border-b border-neutral-100 last:border-0 last:pb-0 font-sans">
                    <p className="font-semibold text-neutral-800">
                      {log.profiles?.name || 'Administrator'}
                    </p>
                    <p className="text-neutral-600 leading-relaxed text-[11px]">
                      Melakukan tindakan <span className="font-semibold text-neutral-900 font-mono text-[10px] bg-neutral-100 px-1 py-0.5">{log.action}</span> pada sumber data{' '}
                      <span className="font-semibold text-neutral-900">{log.resource_type}</span> (ID: {log.resource_id || '-'})
                    </p>
                    <p className="text-[10px] text-neutral-400 font-normal">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
