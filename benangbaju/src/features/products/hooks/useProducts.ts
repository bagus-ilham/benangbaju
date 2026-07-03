import { useQuery } from '@tanstack/react-query'
import {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  ProductFilters,
} from '@/features/products/services'
import { createBrowserClient } from '@/lib/supabase/client'

export function useProducts(filters: ProductFilters = {}) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(supabase, filters),
  })
}

export function useProduct(slug: string) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(supabase, slug),
    enabled: !!slug,
  })
}

export function useRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['related-products', productId, categoryId, limit],
    queryFn: () => getRelatedProducts(supabase, productId, categoryId, limit),
    enabled: !!productId && !!categoryId,
  })
}
