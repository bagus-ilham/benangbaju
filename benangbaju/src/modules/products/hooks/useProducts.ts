import { useQuery } from '@tanstack/react-query'
import {
  getProductsAction,
  getProductBySlugAction,
  getRelatedProductsAction,
} from '@/modules/products/actions'
import { ProductFilters } from '@/modules/products/types'

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProductsAction(filters),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlugAction(slug),
    enabled: !!slug,
  })
}

export function useRelatedProducts(productId: string, categoryId: string, limit = 4) {
  return useQuery({
    queryKey: ['related-products', productId, categoryId, limit],
    queryFn: () => getRelatedProductsAction(productId, categoryId, limit),
    enabled: !!productId && !!categoryId,
  })
}
