// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Json } from '@/shared/types/database'
export interface SiteSetting {
  key: string
  value: string
  type: 'text' | 'json' | 'boolean' | 'image' | 'number'
  group: 'general' | 'seo' | 'payment' | 'social'
  label: string
}
