import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import type { ProductPayload } from '@/modules/products/types'
import {
  updateProductActiveStatusAction,
  updateProductFeaturedStatusAction,
  adminGetProductsAction,
  adminCreateProductAction,
  adminUpdateProductAction,
  adminDeleteProductAction,
} from '@/modules/products/actions'
import { AdminProductListItem } from '@/modules/products/types'

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
    queryFn: () => adminGetProductsAction({ page, limit, search }),
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
      return adminCreateProductAction(productData, variants, images, links, collectionIds)
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
      return adminUpdateProductAction(
        productId,
        productData,
        variants,
        images,
        links,
        collectionIds
      )
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
      await adminDeleteProductAction(productId)
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
