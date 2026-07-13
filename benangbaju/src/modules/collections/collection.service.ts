import { collectionRepository } from './collection.repository'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import type { Collection, AdminCollectionItem } from './types'

export class CollectionService {
  async getActiveCollections(page = 1, limit = 20): Promise<ApiListResponse<Collection>> {
    return collectionRepository.getActiveCollections(page, limit)
  }

  async getCollectionBySlug(slug: string): Promise<ApiResponse<Collection | null>> {
    return collectionRepository.getCollectionBySlug(slug)
  }

  async adminGetCollections(page = 1, limit = 20): Promise<ApiListResponse<AdminCollectionItem>> {
    return collectionRepository.adminGetCollections(page, limit)
  }

  async adminCreateCollection(
    collectionData: {
      name: string
      slug: string
      description: string | null
      image_url: string | null
      sort_order: number
      is_active: boolean
      starts_at: string | null
      ends_at: string | null
    },
    productIds: string[]
  ): Promise<ApiResponse<{ id: string }>> {
    return collectionRepository.adminCreateCollection(collectionData, productIds)
  }

  async adminUpdateCollection(
    collectionId: string,
    collectionData: {
      name: string
      slug: string
      description: string | null
      image_url: string | null
      sort_order: number
      is_active: boolean
      starts_at: string | null
      ends_at: string | null
    },
    productIds: string[]
  ): Promise<ApiResponse<{ id: string }>> {
    return collectionRepository.adminUpdateCollection(collectionId, collectionData, productIds)
  }

  async adminDeleteCollection(collectionId: string): Promise<ApiResponse<void>> {
    return collectionRepository.adminDeleteCollection(collectionId)
  }
}

export const collectionService = new CollectionService()
