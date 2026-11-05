// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SiteSetting {
  key: string
  value: string
  type: 'text' | 'json' | 'boolean' | 'image' | 'number'
  group: 'general' | 'seo' | 'payment' | 'social' | 'shipping'
  label: string
}
