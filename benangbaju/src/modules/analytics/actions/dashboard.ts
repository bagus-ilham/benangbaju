'use server'

import { createServerClient } from '@/lib/supabase/server'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { parseOneToOne, parseOneToMany } from '@/shared/utils/supabase-parser'

export interface LowStockVariant {
  id: string
  name: string
  sku: string
  stock: number
  products: { name: string } | null
}

export interface RecentOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  order_shipping: { recipient_name: string } | null
}

export interface RecentActivityLog {
  id: string
  action: string
  resource_type: string
  resource_id: string | null
  created_at: string
  profiles: { name: string | null; email: string | null } | null
}

export interface AdminDashboardData {
  totalRevenue: number
  activeOrdersCount: number
  completedOrdersCount: number
  customersCount: number
  lowStockVariants: LowStockVariant[]
  recentOrders: RecentOrder[]
  recentLogs: RecentActivityLog[]
}

const LOW_STOCK_THRESHOLD = 5
const LOW_STOCK_LIMIT = 10
const RECENT_ORDERS_LIMIT = 5
const RECENT_LOGS_LIMIT = 5

// Helper functions for mapping nested Supabase relationships
const extractProduct = (item: unknown) => {
  const product = parseOneToOne<{ name?: string }>(item)
  return product ? { name: product.name || '' } : null
}

const extractShipping = (item: unknown) => {
  const shipping = parseOneToOne<{ recipient_name?: string }>(item)
  return shipping ? { recipient_name: shipping.recipient_name || '' } : null
}

const extractProfile = (item: unknown) => {
  const profile = parseOneToOne<{ name?: string | null; email?: string | null }>(item)
  return profile ? { name: profile.name || null, email: profile.email || null } : null
}

const mapLowStockVariants = (data: unknown[]): LowStockVariant[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((v: any) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    stock: v.stock,
    products: extractProduct(v.products),
  }))
}

const mapRecentOrders = (data: unknown[]): RecentOrder[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    total_amount: Number(o.total_amount),
    status: o.status,
    created_at: o.created_at,
    order_shipping: extractShipping(o.order_shipping),
  }))
}

const mapRecentLogs = (data: unknown[]): RecentActivityLog[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((l: any) => ({
    id: l.id,
    action: l.action,
    resource_type: l.resource_type,
    resource_id: l.resource_id,
    created_at: l.created_at,
    profiles: extractProfile(l.profiles),
  }))
}

export async function getAdminDashboardStatsAction(): Promise<AdminDashboardData> {
  const supabase = await createServerClient()

  const [revRes, activeRes, completedRes, custRes, stockRes, ordersRes, logsRes] =
    await Promise.all([
      supabase.rpc('get_dashboard_revenue'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['processing', 'shipped']),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
      supabase
        .from('product_variants')
        .select('id, name, sku, stock, products(name)')
        .eq('is_active', true)
        .lt('stock', LOW_STOCK_THRESHOLD)
        .order('stock', { ascending: true })
        .limit(LOW_STOCK_LIMIT),
      supabase
        .from('orders')
        .select(
          'id, order_number, total_amount, status, created_at, order_shipping(recipient_name)'
        )
        .order('created_at', { ascending: false })
        .limit(RECENT_ORDERS_LIMIT),
      supabase
        .from('admin_activity_logs')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(RECENT_LOGS_LIMIT),
    ])

  if (revRes.error) throw new Error(revRes.error.message)
  if (activeRes.error) throw new Error(activeRes.error.message)
  if (completedRes.error) throw new Error(completedRes.error.message)
  if (custRes.error) throw new Error(custRes.error.message)
  if (stockRes.error) throw new Error(stockRes.error.message)
  if (ordersRes.error) throw new Error(ordersRes.error.message)
  if (logsRes.error) throw new Error(logsRes.error.message)

  return {
    totalRevenue: Number(revRes.data || 0),
    activeOrdersCount: activeRes.count || 0,
    completedOrdersCount: completedRes.count || 0,
    customersCount: custRes.count || 0,
    lowStockVariants: mapLowStockVariants(stockRes.data || []),
    recentOrders: mapRecentOrders(ordersRes.data || []),
    recentLogs: mapRecentLogs(logsRes.data || []),
  }
}
