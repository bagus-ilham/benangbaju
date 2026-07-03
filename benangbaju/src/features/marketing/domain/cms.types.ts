import type { Json } from '@/shared/types/database'
export interface RedirectRule {
  id: string
  from_path: string
  to_path: string
  status_code: number
  is_active: boolean
  created_at: string
}

export interface LandingPage {
  id: string
  slug: string
  title: string
  content: Json
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
