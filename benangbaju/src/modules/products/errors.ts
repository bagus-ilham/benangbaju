export class ProductError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ProductError'
  }
}

export class DuplicateSlugError extends ProductError {
  constructor() {
    super('Slug URL sudah digunakan oleh produk lain. Silakan ubah Slug URL.', 'DUPLICATE_SLUG')
    this.name = 'DuplicateSlugError'
  }
}

export class DuplicateSKUError extends ProductError {
  constructor() {
    super('Terdapat SKU Varian yang sudah terdaftar. Pastikan semua SKU unik.', 'DUPLICATE_SKU')
    this.name = 'DuplicateSKUError'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleProductSupabaseError(err: any, context: string): never {
  if (err?.code === '23505') {
    if (err.message?.includes('products_slug_key')) {
      throw new DuplicateSlugError()
    }
    if (err.message?.includes('product_variants_sku_key')) {
      throw new DuplicateSKUError()
    }
  }
  throw new ProductError(`${context}: ${err?.message || JSON.stringify(err)}`)
}
