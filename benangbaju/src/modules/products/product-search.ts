/**
 * Kamus sinonim kata kunci busana (Indonesian - English)
 * Memastikan pencarian seperti "kemeja" menemukan "shirt", "blus" menemukan "blouse", dll.
 */
export const CLOTHING_SYNONYMS: Record<string, string[]> = {
  // Atasan / Tops (Kategori umum & spesifik)
  atasan: ['atasan', 'top', 'tops', 'shirt', 'shirts', 'blouse', 'blus', 'kemeja', 'kaos'],
  top: ['top', 'tops', 'atasan', 'shirt', 'blouse', 'kemeja', 'blus'],
  tops: ['top', 'tops', 'atasan', 'shirt', 'blouse', 'kemeja', 'blus'],
  kemeja: ['kemeja', 'shirt', 'shirts'],
  shirt: ['shirt', 'shirts', 'kemeja'],
  shirts: ['shirt', 'shirts', 'kemeja'],
  blus: ['blus', 'blouse'],
  blouse: ['blouse', 'blus'],
  kaos: ['kaos', 'tshirt', 't-shirt', 'tee'],
  tshirt: ['tshirt', 't-shirt', 'kaos', 'tee'],
  turtleneck: ['turtleneck', 'inner', 'manset'],
  inner: ['inner', 'manset', 'turtleneck'],
  manset: ['manset', 'inner', 'turtleneck'],

  // Bawahan / Bottoms (Kategori umum & spesifik)
  bawahan: ['bawahan', 'bottoms', 'pants', 'skirt', 'celana', 'rok', 'culotte', 'kulot'],
  bottoms: ['bottoms', 'bawahan', 'pants', 'skirt', 'celana', 'rok', 'culotte', 'kulot'],
  celana: ['celana', 'pants', 'trouser', 'trousers', 'culotte', 'kulot'],
  pants: ['pants', 'celana', 'trouser', 'trousers', 'culotte', 'kulot'],
  trouser: ['trouser', 'trousers', 'celana', 'pants'],
  trousers: ['trouser', 'trousers', 'celana', 'pants'],
  kulot: ['kulot', 'culotte', 'celana', 'pants'],
  culotte: ['culotte', 'kulot', 'celana', 'pants'],
  rok: ['rok', 'skirt'],
  skirt: ['skirt', 'rok'],

  // Dress & Gamis
  dress: ['dress', 'gaun', 'gamis', 'terusan'],
  gaun: ['gaun', 'dress', 'gamis'],
  gamis: ['gamis', 'dress', 'gaun', 'abaya'],
  abaya: ['abaya', 'gamis', 'dress'],
  set: ['set', 'oneset', 'one-set', 'setelan'],
  oneset: ['oneset', 'one-set', 'set', 'setelan'],
  setelan: ['setelan', 'oneset', 'one-set', 'set'],

  // Outerwear
  jaket: ['jaket', 'jacket', 'outerwear', 'outer', 'vest', 'rompi'],
  jacket: ['jacket', 'jaket', 'outerwear', 'outer', 'vest', 'rompi'],
  rompi: ['rompi', 'vest', 'outerwear', 'outer'],
  vest: ['vest', 'rompi', 'outerwear', 'outer'],
  outer: ['outer', 'outerwear', 'vest', 'jacket', 'jaket', 'cardigan', 'kardigan'],
  outerwear: ['outerwear', 'outer', 'vest', 'jacket', 'jaket', 'cardigan'],
  cardigan: ['cardigan', 'kardigan', 'outer'],
  kardigan: ['kardigan', 'cardigan', 'outer'],

  // Hijab & Aksesoris
  hijab: ['hijab', 'jilbab', 'kerudung', 'square', 'pashmina', 'khimar', 'paris'],
  jilbab: ['jilbab', 'hijab', 'kerudung', 'square', 'pashmina', 'khimar'],
  kerudung: ['kerudung', 'hijab', 'jilbab', 'square', 'pashmina'],
  square: ['square', 'hijab', 'segiempat', 'segi empat', 'paris'],
  pashmina: ['pashmina', 'pasmina', 'hijab', 'shawl'],
  pasmina: ['pasmina', 'pashmina', 'hijab', 'shawl'],
  sabuk: ['sabuk', 'belt', 'obi'],
  belt: ['belt', 'sabuk', 'obi'],
  obi: ['obi', 'belt', 'sabuk'],

  // Umum
  baju: ['baju', 'pakaian', 'shirt', 'blouse', 'top', 'tops', 'dress', 'kemeja', 'blus'],
  pakaian: ['pakaian', 'baju', 'outfit', 'busana'],
  busana: ['busana', 'pakaian', 'baju', 'outfit'],
}

/**
 * Memeriksa apakah suatu teks mengandung kata tertentu (pencocokan kata utuh atau awalan).
 */
function matchesWord(text: string | null | undefined, word: string, exactOnly = false): boolean {
  if (!text) return false
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (exactOnly) {
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    return regex.test(text)
  }
  const wordBoundaryRegex = new RegExp(`\\b${escaped}`, 'i')
  return wordBoundaryRegex.test(text)
}

export interface SearchCandidateProduct {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  short_description?: string | null
  meta_title?: string | null
  meta_description?: string | null
  category_id?: string | null
  categories?: { name?: string | null; slug?: string | null } | { name?: string | null; slug?: string | null }[] | null
  product_variants?: { name?: string | null; sku?: string | null }[] | null
  created_at?: string | null
  is_featured?: boolean | null
  min_price?: number | null
  max_price?: number | null
}

/**
 * Menghitung skor relevansi produk terhadap query pencarian.
 * Mengembalikan nilai > 0 jika cocok, dan 0 jika tidak memenuhi kriteria pencarian.
 */
export function scoreProduct(product: SearchCandidateProduct, query: string): number {
  const cleanQuery = query.trim().toLowerCase()
  const tokens = cleanQuery.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0

  const name = (product.name || '').toLowerCase()
  const slug = (product.slug || '').toLowerCase()
  const shortDesc = (product.short_description || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()

  // Ambil nama & slug kategori
  let catName = ''
  let catSlug = ''
  if (product.categories) {
    if (Array.isArray(product.categories)) {
      catName = product.categories.map((c) => c.name || '').join(' ').toLowerCase()
      catSlug = product.categories.map((c) => c.slug || '').join(' ').toLowerCase()
    } else {
      catName = (product.categories.name || '').toLowerCase()
      catSlug = (product.categories.slug || '').toLowerCase()
    }
  }

  const meta = `${product.meta_title || ''} ${product.meta_description || ''}`.toLowerCase()
  const variantText = (product.product_variants || [])
    .map((v) => `${v.name || ''} ${v.sku || ''}`)
    .join(' ')
    .toLowerCase()

  // 1. Direct full query exact matches (paling tinggi)
  if (name === cleanQuery) return 1000
  if (name.includes(cleanQuery)) return 500
  if (slug.includes(cleanQuery)) return 400

  // 2. Tokenize query dengan sinonim busana
  const tokenGroups = tokens.map((t) => ({
    original: t,
    synonyms: CLOTHING_SYNONYMS[t] || [t],
  }))

  let totalScore = 0
  let allTokensMatched = true

  for (const group of tokenGroups) {
    let groupMatched = false
    let groupBestScore = 0

    for (const term of group.synonyms) {
      let termScore = 0
      const isOriginal = term === group.original
      const weight = isOriginal ? 1.0 : 0.85

      // Cocok di Nama Produk (prioritas tertinggi)
      if (matchesWord(name, term, true)) {
        termScore = Math.max(termScore, 150 * weight)
      } else if (matchesWord(name, term, false)) {
        termScore = Math.max(termScore, 80 * weight)
      } else if (name.includes(term)) {
        termScore = Math.max(termScore, 40 * weight)
      }

      // Cocok di Kategori
      if (matchesWord(catName, term, true) || matchesWord(catSlug, term, true)) {
        termScore = Math.max(termScore, 60 * weight)
      } else if (catName.includes(term) || catSlug.includes(term)) {
        termScore = Math.max(termScore, 30 * weight)
      }

      // Cocok di Varian / SKU
      if (matchesWord(variantText, term, true)) {
        termScore = Math.max(termScore, 50 * weight)
      } else if (variantText.includes(term)) {
        termScore = Math.max(termScore, 20 * weight)
      }

      // Cocok di Deskripsi Singkat
      if (matchesWord(shortDesc, term, true)) {
        termScore = Math.max(termScore, 40 * weight)
      } else if (shortDesc.includes(term)) {
        termScore = Math.max(termScore, 15 * weight)
      }

      // Cocok di Deskripsi Lengkap
      if (matchesWord(desc, term, true)) {
        termScore = Math.max(termScore, 25 * weight)
      } else if (desc.includes(term)) {
        termScore = Math.max(termScore, 10 * weight)
      }

      // Cocok di Meta Title / Description
      if (matchesWord(meta, term, true)) {
        termScore = Math.max(termScore, 15 * weight)
      }

      if (termScore > 0) {
        groupMatched = true
        groupBestScore = Math.max(groupBestScore, termScore)
      }
    }

    if (!groupMatched) {
      allTokensMatched = false
      break
    }
    totalScore += groupBestScore
  }

  if (!allTokensMatched) return 0
  return totalScore
}
