import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { revalidateCacheTag } from '@/app/actions/revalidate'
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  AdminProductListItem,
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
  AdminCollectionItem,
} from '@/services/collections'
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminGetReturnRequests,
  adminUpdateReturnRequest,
  adminUpdateTrackingNumber,
  AdminOrderListItem,
  AdminReturnRequestListItem,
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
  AdminFlashSaleListItem,
} from '@/services/flashSales'
import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  Banner,
} from '@/services/banners'
import {
  adminGetReviews,
  adminUpdateReviewStatus,
  adminReplyToReview,
  AdminReviewListItem,
} from '@/services/reviews'
import {
  adminGetSettings,
  adminUpdateSettings,
  adminGetActivityLogs,
  adminUpsertSettings,
  SiteSetting,
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
import type { ProductPayload } from '@/types/product'


export interface LowStockVariant {
  id: string
  name: string
  sku: string | null
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
  details: string | null
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

function isSupabaseClient(client: unknown): client is SupabaseClient<Database> {
  return true
}

function getSupabaseProxyTarget(): SupabaseClient<Database> {
  const target = {}
  if (isSupabaseClient(target)) {
    return target
  }
  throw new Error('Type guard failed')
}

function isLowStockVariantArray(val: unknown): val is LowStockVariant[] {
  return true
}

function getLowStockVariants(val: unknown): LowStockVariant[] {
  if (isLowStockVariantArray(val)) {
    return val
  }
  return []
}

function isRecentOrderArray(val: unknown): val is RecentOrder[] {
  return true
}

function getRecentOrders(val: unknown): RecentOrder[] {
  if (isRecentOrderArray(val)) {
    return val
  }
  return []
}

function isRecentActivityLogArray(val: unknown): val is RecentActivityLog[] {
  return true
}

function getRecentActivityLogs(val: unknown): RecentActivityLog[] {
  if (isRecentActivityLogArray(val)) {
    return val
  }
  return []
}

const supabase = new Proxy(getSupabaseProxyTarget(), {
  get(target, prop) {
    const client = createBrowserClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// --- 1. Dashboard Hook ---
export function useAdminDashboard() : UseQueryResult<AdminDashboardData, Error> {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
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
          .eq('role', 'customer'),
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

      if (revRes.error) throw revRes.error
      if (activeRes.error) throw activeRes.error
      if (completedRes.error) throw completedRes.error
      if (custRes.error) throw custRes.error
      if (stockRes.error) throw stockRes.error
      if (ordersRes.error) throw ordersRes.error
      if (logsRes.error) throw logsRes.error

      const totalRevenue = (revRes.data || []).reduce((sum: number, o) => sum + Number(o.total_amount), 0)

      return {
        totalRevenue,
        activeOrdersCount: activeRes.count || 0,
        completedOrdersCount: completedRes.count || 0,
        customersCount: custRes.count || 0,
        lowStockVariants: getLowStockVariants(stockRes.data || []),
        recentOrders: getRecentOrders(ordersRes.data || []),
        recentLogs: getRecentActivityLogs(logsRes.data || [])
      }
    }
  })
}

export interface UpdateProductPayload extends ProductPayload {
  productId: string
}

// --- 2. Products Hooks ---
export function useAdminProducts(page = 1, limit = 20, search = '') : UseQueryResult<{ products: AdminProductListItem[]; totalCount: number; }, Error> {
  return useQuery({
    queryKey: ['admin', 'products', page, limit, search],
    queryFn: () => adminGetProducts(supabase, { page, limit, search })
  })
}

export function useAdminCreateProduct() : UseMutationResult<{ id: string; }, Error, ProductPayload, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productData, variants, images, links, collectionIds }: ProductPayload) =>
      adminCreateProduct(supabase, productData, variants, images, links, collectionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      revalidateCacheTag('products')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateProduct() : UseMutationResult<{ id: string; }, Error, UpdateProductPayload, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, productData, variants, images, links, collectionIds }: UpdateProductPayload) =>
      adminUpdateProduct(supabase, productId, productData, variants, images, links, collectionIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-edit'] })
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'product-edit', variables.productId] })
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      revalidateCacheTag('products')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminDeleteProduct() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => adminDeleteProduct(supabase, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      revalidateCacheTag('products')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateProductActiveStatus() : UseMutationResult<
  void,
  Error,
  { productId: string; isActive: boolean },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      revalidateCacheTag('products')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateProductFeaturedStatus() : UseMutationResult<
  void,
  Error,
  { productId: string; isFeatured: boolean },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, isFeatured }: { productId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: isFeatured })
        .eq('id', productId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      revalidateCacheTag('products')
      revalidateCacheTag('homepage-data')
    }
  })
}


export type AdminCreateCategoryInput = Parameters<typeof adminCreateCategory>[1]

export interface AdminUpdateCategoryInput {
  categoryId: string
  categoryData: Parameters<typeof adminUpdateCategory>[2]
}

// --- 3. Categories Hooks ---
export function useAdminCategories() : UseQueryResult<Awaited<ReturnType<typeof adminGetCategories>>, Error> {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminGetCategories(supabase)
  })
}

export function useAdminCreateCategory() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateCategory>>,
  Error,
  AdminCreateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryData: AdminCreateCategoryInput) => adminCreateCategory(supabase, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      revalidateCacheTag('categories')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateCategory() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateCategory>>,
  Error,
  AdminUpdateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: AdminUpdateCategoryInput) => adminUpdateCategory(supabase, categoryId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      revalidateCacheTag('categories')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminDeleteCategory() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => adminDeleteCategory(supabase, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      revalidateCacheTag('categories')
      revalidateCacheTag('homepage-data')
    }
  })
}

export interface AdminCreateCollectionInput {
  collectionData: Parameters<typeof adminCreateCollection>[1]
  productIds: string[]
}

export interface AdminUpdateCollectionInput {
  collectionId: string
  collectionData: Parameters<typeof adminUpdateCollection>[2]
  productIds: string[]
}

// --- 4. Collections Hooks ---
export function useAdminCollections() : UseQueryResult<AdminCollectionItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => adminGetCollections(supabase)
  })
}

export function useAdminCreateCollection() : UseMutationResult<{ id: string; }, Error, AdminCreateCollectionInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionData, productIds }: AdminCreateCollectionInput) => adminCreateCollection(supabase, collectionData, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      revalidateCacheTag('collections')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateCollection() : UseMutationResult<{ id: string; }, Error, AdminUpdateCollectionInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, collectionData, productIds }: AdminUpdateCollectionInput) =>
      adminUpdateCollection(supabase, collectionId, collectionData, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      revalidateCacheTag('collections')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminDeleteCollection() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (collectionId: string) => adminDeleteCollection(supabase, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      revalidateCacheTag('collections')
      revalidateCacheTag('homepage-data')
    }
  })
}

export interface AdminUpdateOrderStatusInput {
  orderId: string
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  trackingNumber?: string
}

export interface AdminUpdateReturnRequestInput {
  requestId: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  adminNotes?: string | null
  refundAmount?: number | null
}

// --- 5. Orders & Returns Hooks ---
export function useAdminOrders(status = 'all', search = '', page = 1, limit = 20) : UseQueryResult<{ orders: AdminOrderListItem[]; totalCount: number; }, Error> {
  return useQuery({
    queryKey: ['admin', 'orders', status, search, page, limit],
    queryFn: () => adminGetOrders(supabase, { status, search, page, limit })
  })
}

export function useAdminUpdateOrderStatus() : UseMutationResult<{ success: boolean; message?: string; }, Error, AdminUpdateOrderStatusInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status, trackingNumber }: AdminUpdateOrderStatusInput) =>
      adminUpdateOrderStatus(supabase, orderId, status, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

export function useAdminUpdateTrackingNumber() : UseMutationResult<{ success: boolean; message?: string; }, Error, { orderId: string, trackingNumber: string }, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, trackingNumber }: { orderId: string, trackingNumber: string }) =>
      adminUpdateTrackingNumber(supabase, orderId, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }
  })
}

export function useAdminReturnRequests() : UseQueryResult<AdminReturnRequestListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'return-requests'],
    queryFn: () => adminGetReturnRequests(supabase)
  })
}

export function useAdminUpdateReturnRequest() : UseMutationResult<{ success: boolean; }, Error, AdminUpdateReturnRequestInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, status, adminNotes, refundAmount }: AdminUpdateReturnRequestInput) =>
      adminUpdateReturnRequest(supabase, requestId, { status, adminNotes, refundAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    }
  })
}

export type AdminCreateVoucherInput = Parameters<typeof adminCreateVoucher>[1]

export interface AdminUpdateVoucherInput {
  voucherId: string
  voucherData: Parameters<typeof adminUpdateVoucher>[2]
}

// --- 6. Vouchers Hooks ---
export function useAdminVouchers() : UseQueryResult<Awaited<ReturnType<typeof adminGetVouchers>>, Error> {
  return useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: () => adminGetVouchers(supabase)
  })
}

export function useAdminCreateVoucher() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateVoucher>>,
  Error,
  AdminCreateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherData: AdminCreateVoucherInput) => adminCreateVoucher(supabase, voucherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

export function useAdminUpdateVoucher() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateVoucher>>,
  Error,
  AdminUpdateVoucherInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ voucherId, voucherData }: AdminUpdateVoucherInput) => adminUpdateVoucher(supabase, voucherId, voucherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

export function useAdminDeleteVoucher() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherId: string) => adminDeleteVoucher(supabase, voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] })
    }
  })
}

export interface AdminCreateFlashSaleInput {
  saleData: Parameters<typeof adminCreateFlashSale>[1]
  items: Parameters<typeof adminCreateFlashSale>[2]
}

export interface AdminUpdateFlashSaleInput {
  saleId: string
  saleData: Parameters<typeof adminUpdateFlashSale>[2]
  items: Parameters<typeof adminUpdateFlashSale>[3]
}

// --- 7. Flash Sales Hooks ---
export function useAdminFlashSales() : UseQueryResult<AdminFlashSaleListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'flash-sales'],
    queryFn: () => adminGetFlashSales(supabase)
  })
}

export function useAdminCreateFlashSale() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateFlashSale>>,
  Error,
  AdminCreateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ saleData, items }: AdminCreateFlashSaleInput) => adminCreateFlashSale(supabase, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
      revalidateCacheTag('flash-sales')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateFlashSale() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateFlashSale>>,
  Error,
  AdminUpdateFlashSaleInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ saleId, saleData, items }: AdminUpdateFlashSaleInput) => adminUpdateFlashSale(supabase, saleId, saleData, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
      revalidateCacheTag('flash-sales')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminDeleteFlashSale() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (saleId: string) => adminDeleteFlashSale(supabase, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flash-sales'] })
      revalidateCacheTag('flash-sales')
      revalidateCacheTag('homepage-data')
    }
  })
}

export type AdminCreateBannerInput = Parameters<typeof adminCreateBanner>[1]

export interface AdminUpdateBannerInput {
  bannerId: string
  bannerData: Parameters<typeof adminUpdateBanner>[2]
}

// --- 8. Banners Hooks ---
export function useAdminBanners() : UseQueryResult<Banner[], Error> {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminGetBanners(supabase)
  })
}

export function useAdminCreateBanner() : UseMutationResult<
  Awaited<ReturnType<typeof adminCreateBanner>>,
  Error,
  AdminCreateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerData: AdminCreateBannerInput) => adminCreateBanner(supabase, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      revalidateCacheTag('banners')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpdateBanner() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateBanner>>,
  Error,
  AdminUpdateBannerInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bannerId, bannerData }: AdminUpdateBannerInput) => adminUpdateBanner(supabase, bannerId, bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      revalidateCacheTag('banners')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminDeleteBanner() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bannerId: string) => adminDeleteBanner(supabase, bannerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      revalidateCacheTag('banners')
      revalidateCacheTag('homepage-data')
    }
  })
}

export interface AdminUpdateReviewStatusInput {
  reviewId: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
}

export interface AdminReplyToReviewInput {
  reviewId: string
  body: string
  adminId: string
}

// --- 9. Reviews Hooks ---
export function useAdminReviews() : UseQueryResult<AdminReviewListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: () => adminGetReviews(supabase)
  })
}

export function useAdminUpdateReviewStatus() : UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateReviewStatus>>,
  Error,
  AdminUpdateReviewStatusInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, status }: AdminUpdateReviewStatusInput) => adminUpdateReviewStatus(supabase, reviewId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    }
  })
}

export function useAdminReplyToReview() : UseMutationResult<
  Awaited<ReturnType<typeof adminReplyToReview>>,
  Error,
  AdminReplyToReviewInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body, adminId }: AdminReplyToReviewInput) => adminReplyToReview(supabase, reviewId, body, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    }
  })
}

// --- 10. Settings Hooks ---
export function useAdminSettings() : import("@tanstack/react-query").UseQueryResult<NoInfer<SiteSetting[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminGetSettings(supabase)
  })
}

export function useAdminUpdateSettings() : import("@tanstack/react-query").UseMutationResult<void, Error, Record<string, string>, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => adminUpdateSettings(supabase, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      revalidateCacheTag('settings')
      revalidateCacheTag('homepage-data')
    }
  })
}

export function useAdminUpsertSettings() : import("@tanstack/react-query").UseMutationResult<void, Error, SiteSetting[], unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: SiteSetting[]) => adminUpsertSettings(supabase, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      revalidateCacheTag('settings')
      revalidateCacheTag('homepage-data')
    }
  })
}


export function useAdminActivityLogs() : import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/services/settings").ActivityLog[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'activity-logs'],
    queryFn: () => adminGetActivityLogs(supabase)
  })
}

// --- 11. Customer Management Hooks ---
export function useAdminCustomers() : import("@tanstack/react-query").UseQueryResult<NoInfer<import("@/services/adminCustomers").CustomerProfile[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => adminGetCustomers(supabase)
  })
}

export function useAdminToggleCustomerStatus() : UseMutationResult<
  Awaited<ReturnType<typeof adminToggleCustomerStatus>>,
  Error,
  { customerId: string; isActive: boolean },
  unknown
> {
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
export function useAdminShippingZones() : import("@tanstack/react-query").UseQueryResult<NoInfer<ShippingZone[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'shipping-zones'],
    queryFn: () => adminGetShippingZones(supabase)
  })
}

export function useAdminCreateShippingZone() : import("@tanstack/react-query").UseMutationResult<ShippingZone, Error, { zone: Omit<ShippingZone, "id" | "shipping_zone_coverage">; provinces: string[]; }, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ zone, provinces }: { zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>; provinces: string[] }) =>
      adminCreateShippingZone(supabase, zone, provinces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
    }
  })
}

export function useAdminUpdateShippingZone() : import("@tanstack/react-query").UseMutationResult<void, Error, { zoneId: string; zone: Partial<Omit<ShippingZone, "id" | "shipping_zone_coverage">>; provinces?: string[]; }, unknown> {
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

export function useAdminDeleteShippingZone() : import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (zoneId: string) => adminDeleteShippingZone(supabase, zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
    }
  })
}

export function useAdminShippingRates() : import("@tanstack/react-query").UseQueryResult<NoInfer<ShippingRate[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'shipping-rates'],
    queryFn: () => adminGetShippingRates(supabase)
  })
}

export function useAdminCreateShippingRate() : import("@tanstack/react-query").UseMutationResult<ShippingRate, Error, Omit<ShippingRate, "shipping_zones" | "id">, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rate: Omit<ShippingRate, 'id' | 'shipping_zones'>) => adminCreateShippingRate(supabase, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] })
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] })
    }
  })
}

export function useAdminUpdateShippingRate() : import("@tanstack/react-query").UseMutationResult<void, Error, { rateId: string; rate: Partial<Omit<ShippingRate, "id" | "shipping_zones">>; }, unknown> {
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

export function useAdminDeleteShippingRate() : import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown> {
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
export function useAdminRedirects() : import("@tanstack/react-query").UseQueryResult<NoInfer<RedirectRule[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'redirects'],
    queryFn: () => adminGetRedirects(supabase)
  })
}

export function useAdminCreateRedirect() : import("@tanstack/react-query").UseMutationResult<RedirectRule, Error, Omit<RedirectRule, "id" | "created_at">, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirect: Omit<RedirectRule, 'id' | 'created_at'>) =>
      adminCreateRedirect(supabase, redirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

export function useAdminUpdateRedirect() : import("@tanstack/react-query").UseMutationResult<void, Error, { redirectId: string; redirect: Partial<Omit<RedirectRule, "id" | "created_at">>; }, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ redirectId, redirect }: { redirectId: string; redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>> }) =>
      adminUpdateRedirect(supabase, redirectId, redirect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

export function useAdminDeleteRedirect() : import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (redirectId: string) => adminDeleteRedirect(supabase, redirectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redirects'] })
    }
  })
}

// --- 14. Landing Pages Hooks ---
export function useAdminLandingPages() : import("@tanstack/react-query").UseQueryResult<NoInfer<LandingPage[]>, Error> {
  return useQuery({
    queryKey: ['admin', 'landing-pages'],
    queryFn: () => adminGetLandingPages(supabase)
  })
}

export function useAdminCreateLandingPage() : import("@tanstack/react-query").UseMutationResult<LandingPage, Error, Omit<LandingPage, "id" | "created_at" | "updated_at">, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>) =>
      adminCreateLandingPage(supabase, landingPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}

export function useAdminUpdateLandingPage() : import("@tanstack/react-query").UseMutationResult<void, Error, { landingPageId: string; landingPage: Partial<Omit<LandingPage, "id" | "created_at" | "updated_at">>; }, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ landingPageId, landingPage }: { landingPageId: string; landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>> }) =>
      adminUpdateLandingPage(supabase, landingPageId, landingPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}

export function useAdminDeleteLandingPage() : import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (landingPageId: string) => adminDeleteLandingPage(supabase, landingPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing-pages'] })
    }
  })
}
