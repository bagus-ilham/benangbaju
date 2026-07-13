import { z } from 'zod'
import type { InitialProductData } from './ProductForm'

export const productVariantAttrSchema = z.object({
  attr_name: z.string().min(1, 'Nama atribut wajib diisi'),
  attr_value: z.string().min(1, 'Nilai atribut wajib diisi'),
})

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU wajib diisi'),
  name: z.string().min(1, 'Nama varian wajib diisi'),
  price: z.number().min(1, 'Harga harus lebih dari 0'),
  compare_price: z.number().nullable().optional(),
  stock: z.number().min(0, 'Stok tidak boleh negatif'),
  weight_gram: z.number().nullable().optional(),
  is_active: z.boolean(),
  attrs: z.array(productVariantAttrSchema),
})

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, 'URL gambar wajib diisi'),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number(),
  is_primary: z.boolean(),
  variant_id: z.string().nullable().optional(),
})

export const productLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform wajib diisi'),
  url: z.string().min(1, 'URL wajib diisi'),
  label: z.string().nullable().optional(),
  sort_order: z.number(),
})

export const productSchema = z.object({
  productData: z.object({
    name: z.string().min(1, 'Nama produk wajib diisi'),
    slug: z.string().min(1, 'Slug URL wajib diisi'),
    category_id: z.string().min(1, 'Kategori wajib diisi'),
    description: z.string().nullable().optional(),
    short_description: z.string().nullable().optional(),
    weight_gram: z.number().min(1, 'Berat default wajib diisi'),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
    size_guide: z.string().nullable().optional(),
    care_guide: z.string().nullable().optional(),
  }),
  variants: z.array(productVariantSchema).min(1, 'Minimal satu varian produk'),
  images: z.array(productImageSchema),
  links: z.array(productLinkSchema),
  collectionIds: z.array(z.string()),
})

export type ProductFormValues = z.infer<typeof productSchema>

export function mapInitialDataToForm(initialData?: InitialProductData): ProductFormValues {
  if (initialData) {
    return {
      productData: {
        name: initialData.name || '',
        slug: initialData.slug || '',
        category_id: initialData.category_id || '',
        description: initialData.description || '',
        short_description: initialData.short_description || '',
        weight_gram: initialData.weight_gram || 100,
        is_active: initialData.is_active !== false,
        is_featured: !!initialData.is_featured,
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        size_guide: initialData.size_guide || '',
        care_guide: initialData.care_guide || '',
      },
      variants:
        initialData.product_variants?.map((v) => ({
          id: v.id,
          sku: v.sku || '',
          name: v.name || '',
          price: Number(v.price) || 0,
          compare_price: v.compare_price ? Number(v.compare_price) : null,
          stock: v.stock || 0,
          weight_gram: v.weight_gram || null,
          is_active: v.is_active !== false,
          attrs:
            v.product_variant_attrs?.map((a) => ({
              attr_name: a.attr_name,
              attr_value: a.attr_value,
            })) || [],
        })) || [],
      images:
        initialData.product_images?.map((img) => ({
          id: img.id,
          url: img.url || '',
          alt_text: img.alt_text || '',
          sort_order: img.sort_order || 0,
          is_primary: !!img.is_primary,
          variant_id: img.variant_id || '',
        })) || [],
      links:
        initialData.product_marketplace_links?.map((link) => ({
          platform: link.platform || 'shopee',
          url: link.url || '',
          label: link.label || '',
          sort_order: link.sort_order || 0,
        })) || [],
      collectionIds: initialData.collection_products?.map((cp) => cp.collection_id) || [],
    }
  }

  // Default values for new product
  return {
    productData: {
      name: '',
      slug: '',
      category_id: '',
      description: '',
      short_description: '',
      weight_gram: 100,
      is_active: true,
      is_featured: false,
      meta_title: '',
      meta_description: '',
      size_guide: '',
      care_guide: '',
    },
    variants: [
      {
        id: 'temp-default',
        sku: '',
        name: 'Default',
        price: 0,
        compare_price: null,
        stock: 10,
        weight_gram: null,
        is_active: true,
        attrs: [],
      },
    ],
    images: [
      {
        url: '',
        alt_text: '',
        sort_order: 0,
        is_primary: true,
        variant_id: null,
      },
    ],
    links: [],
    collectionIds: [],
  }
}
