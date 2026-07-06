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
  adminGetCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
  AdminCollectionItem,
} from '@/modules/collections/services'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'

export interface AdminCreateCollectionInput {
  collectionData: Parameters<typeof adminCreateCollection>[1]
  productIds: string[]
}

export interface AdminUpdateCollectionInput {
  collectionId: string
  collectionData: Parameters<typeof adminUpdateCollection>[2]
  productIds: string[]
}

export function useAdminCollections(): UseQueryResult<ApiListResponse<AdminCollectionItem>, Error> {
  return useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => adminGetCollections(getAdminSupabase()),
  })
}

export function useAdminCreateCollection(): UseMutationResult<
  ApiResponse<{ id: string }>,
  Error,
  AdminCreateCollectionInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ collectionData, productIds }: AdminCreateCollectionInput) => {
      const res = await adminCreateCollection(getAdminSupabase(), collectionData, productIds)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat koleksi')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useAdminUpdateCollection(): UseMutationResult<
  ApiResponse<{ id: string }>,
  Error,
  AdminUpdateCollectionInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      collectionId,
      collectionData,
      productIds,
    }: AdminUpdateCollectionInput) => {
      const res = await adminUpdateCollection(
        getAdminSupabase(),
        collectionId,
        collectionData,
        productIds
      )
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui koleksi')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useAdminDeleteCollection(): UseMutationResult<
  ApiResponse<void>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (collectionId: string) => {
      const res = await adminDeleteCollection(getAdminSupabase(), collectionId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus koleksi')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}
