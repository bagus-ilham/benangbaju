import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  AdminProductListItem,
} from '@/services/products'
import type { ProductPayload } from '@/types/product'
import { updateProductActiveStatusAction, updateProductFeaturedStatusAction } from '@/actions/admin'
import { revalidateCacheTag } from '@/actions/revalidate'

export interface UpdateProductPayload extends ProductPayload {
  productId: string
}

export function useAdminProducts(page = 1, limit = 20, search = '') : UseQueryResult<{ products: AdminProductListItem[]; totalCount: number; }, Error> {
  return useQuery({
    queryKey: ['admin', 'products', page, limit, search],
    queryFn: () => adminGetProducts(getAdminSupabase(), { page, limit, search })
  })
}

export function useAdminCreateProduct() : UseMutationResult<{ id: string; }, Error, ProductPayload, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productData, variants, images, links, collectionIds }: ProductPayload) =>
      adminCreateProduct(getAdminSupabase(), productData, variants, images, links, collectionIds),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products', 'dashboard'], ['products', 'homepage-data'])
    }
  })
}

export function useAdminUpdateProduct() : UseMutationResult<{ id: string; }, Error, UpdateProductPayload, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, productData, variants, images, links, collectionIds }: UpdateProductPayload) =>
      adminUpdateProduct(getAdminSupabase(), productId, productData, variants, images, links, collectionIds),
    onSuccess: (data, variables) => {
      invalidateAdminQueries(queryClient, ['products', 'product-edit', 'dashboard'], ['products', 'homepage-data'])
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'product-edit', variables.productId] })
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    }
  })
}

export function useAdminDeleteProduct() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => adminDeleteProduct(getAdminSupabase(), productId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products', 'dashboard'], ['products', 'homepage-data'])
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
      await updateProductActiveStatusAction(productId, isActive)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
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
      await updateProductFeaturedStatusAction(productId, isFeatured)
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['products'], ['products', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    }
  })
}
