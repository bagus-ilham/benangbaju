'use server'

import { createServerClient } from '@/lib/supabase/server'
import type { AdminDashboardData } from '@/hooks/useAdmin'

export async function getAdminDashboardStatsAction(): Promise<AdminDashboardData> {
  const supabase = await createServerClient()

  const [
    revRes,
    activeRes,
    completedRes,
    custRes,
    stockRes,
    ordersRes,
    logsRes
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total_amount')
      .neq('status', 'cancelled')
      .neq('status', 'pending_payment')
      .neq('status', 'refunded'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['processing', 'shipped']),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin'),
    supabase
      .from('product_variants')
      .select('id, name, sku, stock, products(name)')
      .eq('is_active', true)
      .lt('stock', 5)
      .order('stock', { ascending: true })
      .limit(10),
    supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, order_shipping(recipient_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('admin_activity_logs')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  if (revRes.error) throw new Error(revRes.error.message)
  if (activeRes.error) throw new Error(activeRes.error.message)
  if (completedRes.error) throw new Error(completedRes.error.message)
  if (custRes.error) throw new Error(custRes.error.message)
  if (stockRes.error) throw new Error(stockRes.error.message)
  if (ordersRes.error) throw new Error(ordersRes.error.message)
  if (logsRes.error) throw new Error(logsRes.error.message)

  const totalRevenue = (revRes.data || []).reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)

  // Explicit type mapping to match AdminDashboardData
  const lowStockVariants = (stockRes.data || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    stock: v.stock,
    products: v.products
      ? Array.isArray(v.products) 
        ? { name: v.products[0]?.name || '' } 
        : { name: v.products.name || '' }
      : null
  }))

  const recentOrders = (ordersRes.data || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    total_amount: Number(o.total_amount),
    status: o.status,
    created_at: o.created_at,
    order_shipping: o.order_shipping
      ? Array.isArray(o.order_shipping)
        ? { recipient_name: o.order_shipping[0]?.recipient_name || '' }
        : { recipient_name: o.order_shipping.recipient_name || '' }
      : null
  }))

  const recentLogs = (logsRes.data || []).map((l: any) => ({
    id: l.id,
    action: l.action,
    resource_type: l.resource_type,
    resource_id: l.resource_id,
    details: l.details,
    created_at: l.created_at,
    profiles: l.profiles
      ? Array.isArray(l.profiles)
        ? { name: l.profiles[0]?.name || null, email: l.profiles[0]?.email || null }
        : { name: l.profiles.name || null, email: l.profiles.email || null }
      : null
  }))

  return {
    totalRevenue,
    activeOrdersCount: activeRes.count || 0,
    completedOrdersCount: completedRes.count || 0,
    customersCount: custRes.count || 0,
    lowStockVariants,
    recentOrders,
    recentLogs
  }
}

export async function getAdminCustomersAction() {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const { adminGetCustomers } = await import('@/modules/adminCustomer/infrastructure/adminCustomer.repository')
  
  const supabaseAdmin = createAdminClient()
  return adminGetCustomers(supabaseAdmin)
}

export async function toggleAdminCustomerStatusAction(customerId: string, isActive: boolean) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const { adminToggleCustomerStatus } = await import('@/modules/adminCustomer/infrastructure/adminCustomer.repository')
  
  const supabaseAdmin = createAdminClient()
  return adminToggleCustomerStatus(supabaseAdmin, customerId, isActive)
}
