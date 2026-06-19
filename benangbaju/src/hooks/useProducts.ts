import { useQuery } from '@tanstack/react-query'
import { getProducts, getProductBySlug, getRelatedProducts, ProductFilters } from '@/services/products'
import { createBrowserClient } from '@/lib/supabase/client'

export function useProducts(filters: ProductFilters = {}) : import("D:/Aulia Project/benangbaju/node_modules/@tanstack/react-query/build/modern/_tsup-dts-rollup").UseQueryResult<NoInfer<{ products: import("D:/Aulia Project/benangbaju/src/services/products").ProductListItem[]; totalCount: number; }>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(supabase, filters),
  })
}

export function useProduct(slug: string) : import("D:/Aulia Project/benangbaju/node_modules/@tanstack/react-query/build/modern/_tsup-dts-rollup").UseQueryResult<NoInfer<import("D:/Aulia Project/benangbaju/src/services/products").ProductDetailItem | null>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(supabase, slug),
    enabled: !!slug,
  })
}

export function useRelatedProducts(productId: string, categoryId: string, limit = 4) : import("D:/Aulia Project/benangbaju/node_modules/@tanstack/react-query/build/modern/_tsup-dts-rollup").UseQueryResult<NoInfer<import("D:/Aulia Project/benangbaju/src/services/products").ProductListItem[]>, Error> {
  const supabase = createBrowserClient()
  return useQuery({
    queryKey: ['related-products', productId, categoryId, limit],
    queryFn: () => getRelatedProducts(supabase, productId, categoryId, limit),
    enabled: !!productId && !!categoryId,
  })
}
