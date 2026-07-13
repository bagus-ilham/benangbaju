'use client'

import React, { useState } from 'react'
import { useAdminAnalytics } from '@/app/admin/hooks/useAdmin'
import { AdminPageHeader } from '@/shared/components'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { formatIDR } from '@/lib/utils/format'
import { TrendingUp, ShoppingBag, Ticket, AlertCircle, ShoppingCart } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const { data: analytics, isLoading, isError } = useAdminAnalytics(days)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat data analitik...
        </p>
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
        <p className="text-red-500 text-sm">Gagal memuat data analitik.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <AdminPageHeader
          title="Analisis Penjualan & Performa"
          subtitle="Tinjauan mendalam performa bisnis berdasarkan data transaksi yang valid."
        />
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-xs font-semibold py-2 px-3 border border-neutral-200 bg-white text-neutral-900 rounded-none focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value={7}>7 Hari Terakhir</option>
          <option value={30}>30 Hari Terakhir</option>
          <option value={90}>90 Hari Terakhir</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-none">
          <div className="flex items-center text-neutral-500 mb-2">
            <TrendingUp size={16} className="mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Total Pendapatan</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatIDR(analytics.totalRevenue)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Dalam {days} hari terakhir</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-none">
          <div className="flex items-center text-neutral-500 mb-2">
            <ShoppingBag size={16} className="mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Total Pesanan Sukses</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{analytics.totalOrders}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Dalam {days} hari terakhir</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-none">
          <div className="flex items-center text-neutral-500 mb-2">
            <ShoppingCart size={16} className="mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">
              Keranjang Ditinggalkan
            </h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{analytics.abandonedCartsCount}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Total Abandoned Carts (&gt;24j)</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-none">
          <div className="flex items-center text-neutral-500 mb-2">
            <Ticket size={16} className="mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Voucher Digunakan</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {analytics.voucherUsage.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">Pada pesanan sukses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Penjualan */}
        <div className="bg-white border border-neutral-200 p-6 rounded-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-6">
            Tren Pendapatan
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#737373' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#737373' }}
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatIDR(Number(value) || 0), 'Pendapatan']}
                  contentStyle={{
                    fontSize: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#171717"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-neutral-200 p-6 rounded-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-6">
            Produk Terlaris
          </h3>
          <div className="h-[300px] w-full">
            {analytics.topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-400 text-xs">Belum ada data penjualan.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#737373' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#171717' }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{
                      fontSize: '12px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '0',
                    }}
                  />
                  <Bar dataKey="quantity" fill="#171717" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Voucher */}
      {analytics.voucherUsage.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Performa Voucher (Berdasarkan Pesanan Sukses)
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <tr>
                <th className="py-3 px-6 font-medium">ID Voucher</th>
                <th className="py-3 px-6 font-medium text-right">Kali Digunakan</th>
                <th className="py-3 px-6 font-medium text-right">Total Diskon Diberikan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {analytics.voucherUsage.map((v, i) => (
                <tr key={i} className="hover:bg-neutral-50/50">
                  <td className="py-3 px-6 font-mono text-xs">{v.code}</td>
                  <td className="py-3 px-6 text-right font-medium">{v.count}</td>
                  <td className="py-3 px-6 text-right">{formatIDR(v.totalDiscount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
