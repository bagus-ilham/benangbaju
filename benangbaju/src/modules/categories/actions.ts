'use server'

import { categoryService } from './category.service'
import { requireAdmin } from '@/lib/auth-guard'

// Public Actions
export async function getActiveCategoriesAction() {
  return categoryService.getActiveCategories()
}

export async function getCategoryBySlugAction(slug: string) {
  return categoryService.getCategoryBySlug(slug)
}

// Admin Actions
export async function getAdminCategoriesAction() {
  await requireAdmin()
  return categoryService.adminGetCategories()
}

export async function createAdminCategoryAction(categoryData: {
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}) {
  await requireAdmin()
  return categoryService.adminCreateCategory(categoryData)
}

export async function updateAdminCategoryAction(
  categoryId: string,
  categoryData: {
    parent_id: string | null
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
  }
) {
  await requireAdmin()
  return categoryService.adminUpdateCategory(categoryId, categoryData)
}

export async function deleteAdminCategoryAction(categoryId: string) {
  await requireAdmin()
  return categoryService.adminDeleteCategory(categoryId)
}
