import { createBrowserClient } from '../lib/supabase/client'
import type { Database } from '../types/database'

const supabase = createBrowserClient()

async function test() {
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .single()
    
  if (category) {
    console.log(category.id)
  }
}
