import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { getAdminSupabase } from '@/shared/hooks/supabaseClient'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  AdminProductListItem,
} from '@/modules/products/services'
import type { ProductPayload } from '@/modules/products/types'
import {
  updateProductActiveStatusAction,
  updateProductFeaturedStatusAction,
} from '@/modules/products/actions'

export interface UpdateProductPayload extends ProductPayload {
  productId: string
}

import { ApiListResponse } from '@/lib/api-response'

export function useAdminProducts(
  page = 1,
  limit = 20,
  search = ''
): UseQueryResult<ApiListResponse<AdminProductListItem>, Error> {
  return useQuery({
    queryKey: ['admin', 'products', page, limit, search],
    queryFn: () => adminGetProducts(getAdminSupabase(), { page, limit, search }),
  })
}

export function useAdminCreateProduct(): UseMutationResult<
  { id: string },
  Error,
  ProductPayload,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productData, variants, images, links, collectionIds }: ProductPayload) => {
      const res = await adminCreateProduct(
        getAdminSupabase(),
        productData,
        variants,
        images,
        links,
        collectionIds
      )
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat produk')
      return res.data!
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products', 'dashboard'], ['products', 'homepage-data'])
    },
  })
}

export function useAdminUpdateProduct(): UseMutationResult<
  { id: string },
  Error,
  UpdateProductPayload,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      productData,
      variants,
      images,
      links,
      collectionIds,
    }: UpdateProductPayload) => {
      const res = await adminUpdateProduct(
        getAdminSupabase(),
        productId,
        productData,
        variants,
        images,
        links,
        collectionIds
      )
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui produk')
      return res.data!
    },
    onSuccess: (data, variables) => {
      invalidateAdminQueries(
        queryClient,
        ['products', 'product-edit', 'dashboard'],
        ['products', 'homepage-data']
      )
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'product-edit', variables.productId] })
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export function useAdminDeleteProduct(): UseMutationResult<
  { success: boolean },
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await adminDeleteProduct(getAdminSupabase(), productId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus produk')
      return { success: true }
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products', 'dashboard'], ['products', 'homepage-data'])
    },
  })
}

export function useAdminUpdateProductActiveStatus(): UseMutationResult<
  void,
  Error,
  { productId: string; isActive: boolean },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      await updateProductActiveStatusAction(productId, isActive)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export function useAdminUpdateProductFeaturedStatus(): UseMutationResult<
  void,
  Error,
  { productId: string; isFeatured: boolean },
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, isFeatured }: { productId: string; isFeatured: boolean }) => {
      await updateProductFeaturedStatusAction(productId, isFeatured)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}
