import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { getAdminSupabase } from './supabaseClient'
import { invalidateAdminQueries } from './invalidation'
import {
  adminGetCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
  AdminCollectionItem,
} from '@/services/collections'

export interface AdminCreateCollectionInput {
  collectionData: Parameters<typeof adminCreateCollection>[1]
  productIds: string[]
}

export interface AdminUpdateCollectionInput {
  collectionId: string
  collectionData: Parameters<typeof adminUpdateCollection>[2]
  productIds: string[]
}

export function useAdminCollections() : UseQueryResult<AdminCollectionItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => adminGetCollections(getAdminSupabase())
  })
}

export function useAdminCreateCollection() : UseMutationResult<{ id: string; }, Error, AdminCreateCollectionInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionData, productIds }: AdminCreateCollectionInput) => adminCreateCollection(getAdminSupabase(), collectionData, productIds),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useAdminUpdateCollection() : UseMutationResult<{ id: string; }, Error, AdminUpdateCollectionInput, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, collectionData, productIds }: AdminUpdateCollectionInput) =>
      adminUpdateCollection(getAdminSupabase(), collectionId, collectionData, productIds),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}

export function useAdminDeleteCollection() : UseMutationResult<{ success: boolean; }, Error, string, unknown> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (collectionId: string) => adminDeleteCollection(getAdminSupabase(), collectionId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['collections'], ['collections', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    }
  })
}
