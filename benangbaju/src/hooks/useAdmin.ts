import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from '@/services/products'
import {
  adminGetShippingZones,
  adminCreateShippingZone,
  adminUpdateShippingZone,
  adminDeleteShippingZone,
  adminGetShippingRates,
  adminCreateShippingRate,
  adminUpdateShippingRate,
  adminDeleteShippingRate,
  ShippingZone,
  ShippingRate,
} from '@/services/shipping'
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '@/services/categories'
import {
  adminGetCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
} from '@/services/collections'
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetReturnRequests,
  adminUpdateReturnRequest,
} from '@/services/orders'
import {
  adminGetVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
} from '@/services/vouchers'
import {
  adminGetFlashSales,
  adminCreateFlashSale,
  adminUpdateFlashSale,
  adminDeleteFlashSale,
} from '@/services/flashSales'
import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from '@/services/banners'
import {
  adminGetReviews,
  adminUpdateReviewStatus,
  adminReplyToReview,
} from '@/services/reviews'
import {
  adminGetSettings,
  adminUpdateSettings,
  adminGetActivityLogs,
} from '@/services/settings'
import {
  adminGetCustomers,
  adminToggleCustomerStatus,
} from '@/services/adminCustomers'
import {
  adminGetRedirects,
  adminCreateRedirect,
  adminUpdateRedirect,
  adminDeleteRedirect,
  adminGetLandingPages,
  adminCreateLandingPage,
  adminUpdateLandingPage,
  adminDeleteLandingPage,
  RedirectRule,
  LandingPage,
} from '@/services/cms'

const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = createBrowserClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// --- 1. Dashboard Hook ---
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      // Fetch Revenue
      const { data: revData, error: revErr } = await supabase
        .from('orders')
        .select('total_amount')
        .neq('status', 'cancelled')
        .neq('status', 'pending_payment')
        .neq('status', 'refunded')
      if (revErr) throw revErr
      const totalRevenue = (revData || []).reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)

      // Fetch Active Orders Count
      const { count: activeCount, error: activeErr } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['processing', 'shipped'])
      if (activeErr) throw activeErr

      // Fetch Completed Orders Count
      const { count: completedCount, error: completedErr } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      if (completedErr) throw completedErr

      // Fetch Customers Count
      const { count: customersCount, error: custErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
      if (custErr) throw custErr

      // Fetch Low Stock Variants
      const { data: lowStock, error: stockErr } = await supabase
        .from('product_variants')
        .select('id, name, sku, stock, products(name)')
        .eq('is_active', true)
        .lt('stock', 5)
        .order('stock', { ascending: true })
        .limit(10)
      if (stockErr) throw stockErr

      // Fetch Recent Orders
      const { data: recentOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at, order_shipping(recipient_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      if (ordersErr) throw ordersErr

      // Fetch Recent Activity Logs
      const { data: recentLogs, error: logsErr } = await supabase
        .from('admin_activity_logs')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(5)
      if (logsErr) throw logsErr

      return {
        totalRevenue,
        activeOrdersCount: activeCount || 0,
        completedOrdersCount: completedCount || 0,
        customersCount: customersCount || 0,
        lowStockVariants: lowStock || [],
        recentOrders: recentOrders || [],
        recentLogs: recentLogs || []
      }
    }
  })
}

// --- 2. Products Hooks ---
export function useAdminProducts(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['admin', 'products', page, limit, search],
    queryFn: () => adminGetProducts(supabase, { page, limit, search })
  })
}

export function useAdminCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productData, variants, images, links }: any) =>
      adminCreateProduct(supabase, productData, variants, images, links),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, productData, variants, images, links }: any) =>
      adminUpdateProduct(supabase, productId, productData, variants, images, links),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    }
  })
}

export function useAdminDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => adminDeleteProduct(supabase, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

// --- 3. Categories Hooks ---
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminGetCategories(supabase)
  })
}

export function useAdminCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryData: any) => adminCreateCategory(supabase, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

export function useAdminUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: any) => adminUpdateCategory(supabase, categoryId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

export function useAdminDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => adminDeleteCategory(supabase, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

// --- 4. Collections Hooks ---
export function useAdminCollections() {
  return useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => adminGetCollections(supabase)
  })
}

export function useAdminCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionData, productIds }: any) => adminCreateCollection(supabase, collectionData, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useAdminUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, collectionData, productIds }: any) =>
      adminUpdateCollection(supabase, collectionId, collectionData, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useAdminDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (collectionId: string) => adminDeleteCollection(supabase, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

// --- 5. Orders & Returns Hooks ---
export function useAdminOrders(status = 'all', search = '', page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'orders', status, search, page, limit],
    queryFn: () => adminGetOrders(supabase, { status, search, page, limit })
  })
}

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status, trackingNumber }: any) =>
      adminUpdateOrderStatus(supabase, orderId, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

export function useAdminReturnRequests() {
  return useQuery({
    queryKey: ['admin', 'return-requests'],
    queryFn: () => adminGetReturnRequests(supabase)
  })
}

export function useAdminUpdateReturnRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, status, adminNotes, refundAmount }: any) =>
      adminUpdateReturnRequest(supabase, requestId, { status, adminNotes, refundAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    }
  })
}

// --- 6. Vouchers Hooks ---
export function useAdminVouchers() {
  return useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => adminGetVouchers(supabase)
  })
}

export function useAdminCreateVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherData: any) => adminCreateVoucher(supabase, voucherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

export function useAdminUpdateVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ voucherId, voucherData }: any) => adminUpdateVoucher(supabase, voucherId, voucherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

export function useAdminDeleteVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherId: string) => adminDeleteVoucher(supabase, voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

// --- 7. Flash Sales Hooks ---
export function useAdminFlashSales() {
  return useQuery({
    queryKey: ['admin', 'flash-sales'],
    queryFn: () => adminGetFlashSales(supabase)
  })
}

export function useAdminCreateFlashSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ saleData, items }: any) => adminCreateFlashSale(supabase, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
    }
  })
}

export function useAdminUpdateFlashSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ saleId, saleData, items }: any) => adminUpdateFlashSale(supabase, saleId, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
    }
  })
}

export function useAdminDeleteFlashSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (saleId: string) => adminDeleteFlashSale(supabase, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
    }
  })
}

// --- 8. Banners Hooks ---
export function useAdminBanners() {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminGetBanners(supabase)
  })
}

export function useAdminCreateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerData: any) => adminCreateBanner(supabase, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

export function useAdminUpdateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bannerId, bannerData }: any) => adminUpdateBanner(supabase, bannerId, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

export function useAdminDeleteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerId: string) => adminDeleteBanner(supabase, bannerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    }
  })
}

// --- 9. Reviews Hooks ---
export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => adminGetReviews(supabase)
  })
}

export function useAdminUpdateReviewStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, status }: any) => adminUpdateReviewStatus(supabase, reviewId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    }
  })
}

export function useAdminReplyToReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body, adminId }: any) => adminReplyToReview(supabase, reviewId, body, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    }
  })
}

// --- 10. Settings Hooks ---
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminGetSettings(supabase)
  })
}

export function useAdminUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => adminUpdateSettings(supabase, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    }
  })
}

export function useAdminActivityLogs() {
  return useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: () => adminGetActivityLogs(supabase)
  })
}

// --- 11. Customer Management Hooks ---
export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => adminGetCustomers(supabase)
  })
}

export function useAdminToggleCustomerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, isActive }: { customerId: string; isActive: boolean }) =>
      adminToggleCustomerStatus(supabase, customerId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

// --- 12. Shipping Management Hooks ---
export function useAdminShippingZones() {
  return useQuery({
    queryKey: ['admin', 'shipping-zones'],
    queryFn: () => adminGetShippingZones(supabase)
  })
}

export function useAdminCreateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zone, provinces }: { zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>; provinces: string[] }) =>
      adminCreateShippingZone(supabase, zone, provinces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
    }
  })
}

export function useAdminUpdateShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zoneId, zone, provinces }: { zoneId: string; zone: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>; provinces?: string[] }) =>
      adminUpdateShippingZone(supabase, zoneId, zone, provinces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] }) // Invalidate calculation cache too
    }
  })
}

export function useAdminDeleteShippingZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (zoneId: string) => adminDeleteShippingZone(supabase, zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
    }
  })
}

export function useAdminShippingRates() {
  return useQuery({
    queryKey: ['admin', 'shipping-rates'],
    queryFn: () => adminGetShippingRates(supabase)
  })
}

export function useAdminCreateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rate: Omit<ShippingRate, 'id' | 'shipping_zones'>) => adminCreateShippingRate(supabase, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

export function useAdminUpdateShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rateId, rate }: { rateId: string; rate: Partial<Omit<ShippingRate, 'id' | 'shipping_zones'>> }) =>
      adminUpdateShippingRate(supabase, rateId, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

export function useAdminDeleteShippingRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rateId: string) => adminDeleteShippingRate(supabase, rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

// --- 13. Redirects Hooks ---
export function useAdminRedirects() {
  return useQuery({
    queryKey: ['admin', 'redirects'],
    queryFn: () => adminGetRedirects(supabase)
  })
}

export function useAdminCreateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirect: Omit<RedirectRule, 'id' | 'created_at'>) =>
      adminCreateRedirect(supabase, redirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

export function useAdminUpdateRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ redirectId, redirect }: { redirectId: string; redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>> }) =>
      adminUpdateRedirect(supabase, redirectId, redirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

export function useAdminDeleteRedirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirectId: string) => adminDeleteRedirect(supabase, redirectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

// --- 14. Landing Pages Hooks ---
export function useAdminLandingPages() {
  return useQuery({
    queryKey: ['admin', 'landing-pages'],
    queryFn: () => adminGetLandingPages(supabase)
  })
}

export function useAdminCreateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) =>
      adminCreateLandingPage(supabase, landingPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}

export function useAdminUpdateLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ landingPageId, landingPage }: { landingPageId: string; landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>> }) =>
      adminUpdateLandingPage(supabase, landingPageId, landingPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}

export function useAdminDeleteLandingPage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPageId: string) => adminDeleteLandingPage(supabase, landingPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}
