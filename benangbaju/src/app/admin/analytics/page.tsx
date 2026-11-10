'use client'

import React, { useState } from 'react'
import { useAdminAnalytics } from '@/app/admin/hooks/useAdmin'
import { AdminPageHeader } from '@/shared/components'
import dynamic from 'next/dynamic'
import { formatIDR, formatApproxMYR, formatMYR } from '@/lib/utils/format'
import { HandDrawnIcon, Button } from '@/shared/components'

const RevenueTrendChart = dynamic(
  () => import('./components/AnalyticsCharts').then((m) => m.RevenueTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-xs text-neutral-400">
        Memuat grafik...
      </div>
    ),
  }
)

const TopProductsChart = dynamic(
  () => import('./components/AnalyticsCharts').then((m) => m.TopProductsChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-xs text-neutral-400">
        Memuat grafik...
      </div>
    ),
  }
)

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'ID' | 'MY'>('ALL')
  const { data: analytics, isLoading, isError } = useAdminAnalytics(days, marketFilter)

  const handleExportCSV = () => {
    if (!analytics) return
    const rows = [
      ['--- RINGKASAN ANALITIK ---'],
      ['Filter Pasar', marketFilter === 'ALL' ? 'Semua Pasar' : marketFilter],
      ['Total Pendapatan (IDR)', analytics.totalRevenue],
      ['Total Pesanan Sukses', analytics.totalOrders],
      ['Keranjang Ditinggalkan', analytics.abandonedCartsCount],
      [],
      ['--- TREN PENDAPATAN ---'],
      ['Tanggal', 'Pendapatan (IDR)'],
      ...analytics.revenueTrends.map((r) => [r.date, r.revenue]),
      [],
      ['--- PRODUK TERLARIS ---'],
      ['Nama Produk', 'Jumlah Terjual', 'Total Pendapatan (IDR)'],
      ...analytics.topProducts.map((p) => [p.name, p.quantity, p.revenue]),
      [],
      ['--- PENGGUNAAN VOUCHER ---'],
      ['Kode Voucher', 'Jumlah Penggunaan', 'Total Diskon (IDR)'],
      ...analytics.voucherUsage.map((v) => [v.code, v.count, v.totalDiscount]),
      [],
      ['--- PERFORMA PASAR (NEGARA) ---'],
      ['Negara', 'Jumlah Pesanan Sukses', 'Total Pendapatan (IDR)', 'Total Pendapatan (MYR)'],
      ...(analytics.countryBreakdown || []).map((c) => [
        c.countryCode === 'MY' ? 'Malaysia (MY)' : 'Indonesia (ID)',
        c.ordersCount,
        c.revenue,
        c.revenueMyr != null ? c.revenueMyr : '',
      ]),
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan-analitik-${marketFilter.toLowerCase()}-${days}hari.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
        <HandDrawnIcon name="alert-triangle" className="h-6 w-6 mx-auto text-red-500 mb-2" />
        <p className="text-red-500 text-sm">Gagal memuat data analitik.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="Analisis Penjualan & Performa"
          subtitle="Tinjauan mendalam performa bisnis berdasarkan data transaksi yang valid."
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter Pasar (ALL / ID / MY) */}
          <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-neutral-200">
            <button
              type="button"
              onClick={() => setMarketFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                marketFilter === 'ALL'
                  ? 'bg-brand-plum text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Semua Pasar
            </button>
            <button
              type="button"
              onClick={() => setMarketFilter('ID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                marketFilter === 'ID'
                  ? 'bg-brand-plum text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🇮🇩 Indonesia
            </button>
            <button
              type="button"
              onClick={() => setMarketFilter('MY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                marketFilter === 'MY'
                  ? 'bg-brand-plum text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🇲🇾 Malaysia
            </button>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs font-semibold py-2 px-3 border border-neutral-200"
          >
            Unduh CSV
          </Button>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs font-semibold py-2 px-3 border border-neutral-200 bg-brand-cream text-neutral-900 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
            <option value={90}>90 Hari Terakhir</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl">
          <div className="flex items-center text-neutral-500 mb-2">
            <HandDrawnIcon name="clipboard-list" className="w-4 h-4 mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Total Pendapatan</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatIDR(analytics.totalRevenue)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">
            Dalam {days} hari ({marketFilter === 'ALL' ? 'Semua Pasar' : `Pasar ${marketFilter}`})
          </p>
        </div>

        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl">
          <div className="flex items-center text-neutral-500 mb-2">
            <HandDrawnIcon name="shopping-bag" className="w-4 h-4 mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Total Pesanan Sukses</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{analytics.totalOrders}</p>
          <p className="text-[10px] text-neutral-400 mt-1">
            Dalam {days} hari ({marketFilter === 'ALL' ? 'Semua Pasar' : `Pasar ${marketFilter}`})
          </p>
        </div>

        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl">
          <div className="flex items-center text-neutral-500 mb-2">
            <HandDrawnIcon name="shopping-bag" className="w-4 h-4 mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">
              Keranjang Ditinggalkan
            </h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{analytics.abandonedCartsCount}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Total Abandoned Carts (&gt;24j)</p>
        </div>

        <div className="bg-brand-cream border border-neutral-200 p-4 rounded-2xl">
          <div className="flex items-center text-neutral-500 mb-2">
            <HandDrawnIcon name="tag" className="w-4 h-4 mr-2" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Voucher Digunakan</h3>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {analytics.voucherUsage.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">Pada pesanan sukses</p>
        </div>
      </div>

      {/* Performa Pasar: ID vs MY */}
      {(() => {
        const idData = analytics.countryBreakdown?.find((c) => c.countryCode === 'ID') || {
          ordersCount: 0,
          revenue: 0,
          revenueMyr: 0,
        }
        const myData = analytics.countryBreakdown?.find((c) => c.countryCode === 'MY') || {
          ordersCount: 0,
          revenue: 0,
          revenueMyr: 0,
        }
        const totalMarketRev = idData.revenue + myData.revenue || 1
        const idRevPercent = Math.round((idData.revenue / totalMarketRev) * 100)
        const myRevPercent = Math.round((myData.revenue / totalMarketRev) * 100)

        return (
          <div className="bg-brand-cream border border-neutral-200 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200/70 gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <HandDrawnIcon name="globe" className="w-4 h-4 text-brand-plum" />
                  <span>Performa Pasar: Domestik (🇮🇩 ID) vs Ekspor (🇲🇾 MY)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  Distribusi transaksi sukses berdasarkan negara tujuan pengiriman dalam {days} hari
                  terakhir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Indonesia */}
              <div className="p-4 bg-white/60 border border-neutral-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                    <span>🇮🇩</span>
                    <span>Indonesia (Domestik)</span>
                  </span>
                  <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {idRevPercent}% Pendapatan
                  </span>
                </div>
                <p className="text-xl font-bold text-brand-plum">{formatIDR(idData.revenue)}</p>
                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1 border-t border-neutral-100 font-sans">
                  <span>Jumlah Pesanan Sukses</span>
                  <span className="font-bold text-neutral-900">{idData.ordersCount} pesanan</span>
                </div>
              </div>

              {/* Card Malaysia */}
              <div className="p-4 bg-white/60 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <span>🇲🇾</span>
                    <span>Malaysia (Semenanjung, Sabah & Sarawak)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {myRevPercent}% Pendapatan
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-emerald-900">{formatIDR(myData.revenue)}</p>
                  <span className="text-xs font-semibold text-emerald-700">
                    ({myData.revenueMyr ? formatMYR(myData.revenueMyr) : formatApproxMYR(myData.revenue)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1 border-t border-neutral-100 font-sans">
                  <span>Jumlah Pesanan Ekspor</span>
                  <span className="font-bold text-emerald-900">{myData.ordersCount} pesanan</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Penjualan */}
        <div className="bg-brand-cream border border-neutral-200 p-6 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-6">
            Tren Pendapatan {marketFilter !== 'ALL' ? `(${marketFilter})` : ''}
          </h3>
          <div className="h-[300px] w-full">
            <RevenueTrendChart revenueTrends={analytics.revenueTrends} />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-brand-cream border border-neutral-200 p-6 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-6">
            Produk Terlaris {marketFilter !== 'ALL' ? `(${marketFilter})` : ''}
          </h3>
          <div className="h-[300px] w-full">
            {analytics.topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-400 text-xs">Belum ada data penjualan.</p>
              </div>
            ) : (
              <TopProductsChart topProducts={analytics.topProducts} />
            )}
          </div>
        </div>
      </div>

      {/* Tabel Voucher */}
      {analytics.voucherUsage.length > 0 && (
        <div className="bg-brand-cream border border-neutral-200 rounded-2xl overflow-hidden">
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
