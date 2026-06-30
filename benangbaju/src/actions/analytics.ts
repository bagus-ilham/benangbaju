'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface TopProductData {
  name: string;
  quantity: number;
  revenue: number;
}

export interface AnalyticsData {
  revenueTrends: RevenueData[];
  topProducts: TopProductData[];
  voucherUsage: { code: string; count: number; totalDiscount: number }[];
  abandonedCartsCount: number;
  totalRevenue: number;
  totalOrders: number;
}

export async function getAdminAnalyticsAction(days: number = 30): Promise<AnalyticsData> {
  const supabase = await createServerClient()
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // 1. Fetch completed orders in the last N days
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, created_at, total_amount, discount_amount, voucher_id, order_items(product_name, quantity, subtotal)')
    .eq('status', 'completed')
    .gte('created_at', startDateStr)
    .order('created_at', { ascending: true });

  if (ordersError) throw new Error(ordersError.message);

  // 2. Fetch abandoned carts (older than 24h)
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const yesterdayStr = yesterday.toISOString();
  
  const { count: abandonedCartsCount, error: cartsError } = await supabase
    .from('carts')
    .select('*', { count: 'exact', head: true })
    .lte('created_at', yesterdayStr);
    
  if (cartsError) throw new Error(cartsError.message);

  // 3. Process Data
  const revenueMap = new Map<string, number>();
  const productMap = new Map<string, { quantity: number, revenue: number }>();
  const voucherMap = new Map<string, { count: number, totalDiscount: number }>();

  let totalRevenue = 0;
  let totalOrders = orders?.length || 0;

  orders?.forEach(order => {
    // Revenue Trends
    const date = new Date(order.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    revenueMap.set(date, (revenueMap.get(date) || 0) + order.total_amount);
    totalRevenue += order.total_amount;

    // Top Products
    if (order.order_items && Array.isArray(order.order_items)) {
      order.order_items.forEach((item: any) => {
        const pName = item.product_name || 'Unknown';
        const current = productMap.get(pName) || { quantity: 0, revenue: 0 };
        productMap.set(pName, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.subtotal
        });
      });
    }

    // Voucher Usage
    if (order.voucher_id && order.discount_amount > 0) {
      const vId = order.voucher_id;
      const current = voucherMap.get(vId) || { count: 0, totalDiscount: 0 };
      voucherMap.set(vId, {
        count: current.count + 1,
        totalDiscount: current.totalDiscount + order.discount_amount
      });
    }
  });

  const revenueTrends = Array.from(revenueMap.entries()).map(([date, revenue]) => ({ date, revenue }));
  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
    
  const voucherUsage = Array.from(voucherMap.entries())
    .map(([code, data]) => ({ code, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    revenueTrends,
    topProducts,
    voucherUsage,
    abandonedCartsCount: abandonedCartsCount || 0,
    totalRevenue,
    totalOrders
  };
}
