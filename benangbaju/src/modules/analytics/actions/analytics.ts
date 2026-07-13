'use server'

import { requireAdmin } from '@/lib/auth-guard'

export interface RevenueData {
  date: string
  revenue: number
}

export interface TopProductData {
  name: string
  quantity: number
  revenue: number
}

export interface AnalyticsData {
  revenueTrends: RevenueData[]
  topProducts: TopProductData[]
  voucherUsage: { code: string; count: number; totalDiscount: number }[]
  abandonedCartsCount: number
  totalRevenue: number
  totalOrders: number
}

export async function getAdminAnalyticsAction(days: number = 30): Promise<AnalyticsData> {
  const { supabase } = await requireAdmin()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString()

  // 1. Fetch data from RPC and independent queries in parallel
  const yesterday = new Date()
  yesterday.setHours(yesterday.getHours() - 24)
  const yesterdayStr = yesterday.toISOString()

  const [rpcRes, cartsRes, voucherRes] = await Promise.all([
    supabase.rpc('get_analytics_data', { p_start_date: startDateStr }),
    supabase
      .from('carts')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', yesterdayStr),
    supabase
      .from('orders')
      .select('voucher_id, discount_amount, vouchers(code)')
      .eq('status', 'completed')
      .gte('created_at', startDateStr)
      .not('voucher_id', 'is', null),
  ])

  if (rpcRes.error) throw new Error(rpcRes.error.message)
  if (cartsRes.error) throw new Error(cartsRes.error.message)

  const data = (rpcRes.data as Record<string, unknown>) || {}

  // Parse dates for revenue trends if needed to match previous format
  const revenueTrends = (
    (data.revenue_trends as Array<{ date: string; revenue: number | string }>) || []
  ).map((item) => ({
    date: new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    revenue: Number(item.revenue),
  }))

  const topProducts = (
    (data.top_products as Array<{
      name: string
      quantity: number | string
      revenue: number | string
    }>) || []
  ).map((item) => ({
    name: item.name,
    quantity: Number(item.quantity),
    revenue: Number(item.revenue),
  }))

  // Process voucher usage
  const voucherMap = new Map<string, { count: number; totalDiscount: number }>()
  ;(voucherRes.data || []).forEach((order) => {
    if (order.voucher_id && order.discount_amount > 0) {
      // Access the voucher code from the joined table
      const voucherCode = Array.isArray(order.vouchers)
        ? order.vouchers[0]?.code
        : (order.vouchers as { code?: string })?.code || order.voucher_id

      const current = voucherMap.get(voucherCode) || { count: 0, totalDiscount: 0 }
      voucherMap.set(voucherCode, {
        count: current.count + 1,
        totalDiscount: current.totalDiscount + order.discount_amount,
      })
    }
  })

  const voucherUsage = Array.from(voucherMap.entries())
    .map(([code, vdata]) => ({ code, ...vdata }))
    .sort((a, b) => b.count - a.count)

  return {
    revenueTrends,
    topProducts,
    voucherUsage,
    abandonedCartsCount: cartsRes.count || 0,
    totalRevenue: Number(data.total_revenue || 0),
    totalOrders: Number(data.total_orders || 0),
  }
}
