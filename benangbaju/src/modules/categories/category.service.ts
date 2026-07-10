import { categoryRepository } from './category.repository'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import type { Category } from './types'

export class CategoryService {
  async getActiveCategories(): Promise<ApiListResponse<Category>> {
    return categoryRepository.getActiveCategories()
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category | null>> {
    return categoryRepository.getCategoryBySlug(slug)
  }

  async adminGetCategories(): Promise<ApiListResponse<Category>> {
    return categoryRepository.adminGetCategories()
  }

  async adminCreateCategory(categoryData: {
    parent_id: string | null
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
  }): Promise<ApiResponse<Category>> {
    return categoryRepository.adminCreateCategory(categoryData)
  }

  async adminUpdateCategory(
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
  ): Promise<ApiResponse<Category>> {
    return categoryRepository.adminUpdateCategory(categoryId, categoryData)
  }

  async adminDeleteCategory(categoryId: string): Promise<ApiResponse<void>> {
    return categoryRepository.adminDeleteCategory(categoryId)
  }
}

export const categoryService = new CategoryService()
