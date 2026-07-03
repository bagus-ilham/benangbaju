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
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '@/features/marketing/services/categories'

export type AdminCreateCategoryInput = Parameters<typeof adminCreateCategory>[1]

export interface AdminUpdateCategoryInput {
  categoryId: string
  categoryData: Parameters<typeof adminUpdateCategory>[2]
}

export function useAdminCategories(): UseQueryResult<
  Awaited<ReturnType<typeof adminGetCategories>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminGetCategories(getAdminSupabase()),
  })
}

export function useAdminCreateCategory(): UseMutationResult<
  Awaited<ReturnType<typeof adminCreateCategory>>,
  Error,
  AdminCreateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryData: AdminCreateCategoryInput) =>
      adminCreateCategory(getAdminSupabase(), categoryData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminUpdateCategory(): UseMutationResult<
  Awaited<ReturnType<typeof adminUpdateCategory>>,
  Error,
  AdminUpdateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, categoryData }: AdminUpdateCategoryInput) =>
      adminUpdateCategory(getAdminSupabase(), categoryId, categoryData),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminDeleteCategory(): UseMutationResult<
  { success: boolean },
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: string) => adminDeleteCategory(getAdminSupabase(), categoryId),
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
