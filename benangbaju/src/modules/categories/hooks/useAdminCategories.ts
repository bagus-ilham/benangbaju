import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query'
import { invalidateAdminQueries } from '@/shared/hooks/invalidation'
import {
  getAdminCategoriesAction,
  createAdminCategoryAction,
  updateAdminCategoryAction,
  deleteAdminCategoryAction,
} from '@/modules/categories/actions'
import { ApiResponse } from '@/lib/api-response'

export type AdminCreateCategoryInput = Parameters<typeof createAdminCategoryAction>[0]

export interface AdminUpdateCategoryInput {
  categoryId: string
  categoryData: Parameters<typeof updateAdminCategoryAction>[1]
}

export function useAdminCategories(): UseQueryResult<
  Awaited<ReturnType<typeof getAdminCategoriesAction>>,
  Error
> {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => getAdminCategoriesAction(),
  })
}

export function useAdminCreateCategory(): UseMutationResult<
  Awaited<ReturnType<typeof createAdminCategoryAction>>,
  Error,
  AdminCreateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoryData: AdminCreateCategoryInput) => {
      const res = await createAdminCategoryAction(categoryData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal membuat kategori')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminUpdateCategory(): UseMutationResult<
  Awaited<ReturnType<typeof updateAdminCategoryAction>>,
  Error,
  AdminUpdateCategoryInput,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, categoryData }: AdminUpdateCategoryInput) => {
      const res = await updateAdminCategoryAction(categoryId, categoryData)
      if (!res.success) throw new Error(res.error?.message || 'Gagal memperbarui kategori')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useAdminDeleteCategory(): UseMutationResult<
  ApiResponse<void>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await deleteAdminCategoryAction(categoryId)
      if (!res.success) throw new Error(res.error?.message || 'Gagal menghapus kategori')
      return res
    },
    onSuccess: () => {
      invalidateAdminQueries(queryClient, ['categories'], ['categories', 'homepage-data'])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
