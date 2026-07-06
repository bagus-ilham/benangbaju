'use server'

import { requireAdmin } from '@/lib/auth-guard'

export async function updateProductActiveStatusAction(productId: string, isActive: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
  if (error) throw new Error(error.message)
}

export async function updateProductFeaturedStatusAction(productId: string, isFeatured: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('products')
    .update({ is_featured: isFeatured })
    .eq('id', productId)
  if (error) throw new Error(error.message)
}
