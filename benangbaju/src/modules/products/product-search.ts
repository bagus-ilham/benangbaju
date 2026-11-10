/**
 * Kamus sinonim kata kunci busana (Indonesian, Malaysian, English)
 * Memastikan pencarian seperti "kemeja" menemukan "shirt", "blus" menemukan "blouse",
 * "seluar" menemukan "celana", "slack" menemukan "trouser", dll.
 */
export const CLOTHING_SYNONYMS: Record<string, string[]> = {
  // Atasan / Tops (Kategori umum & spesifik)
  atasan: ['atasan', 'top', 'tops', 'shirt', 'shirts', 'blouse', 'blus', 'kemeja', 'kaos', 'tunik', 'tunic'],
  top: ['top', 'tops', 'atasan', 'shirt', 'blouse', 'kemeja', 'blus', 'tunik'],
  tops: ['top', 'tops', 'atasan', 'shirt', 'blouse', 'kemeja', 'blus', 'tunik'],
  kemeja: ['kemeja', 'shirt', 'shirts'],
  shirt: ['shirt', 'shirts', 'kemeja'],
  shirts: ['shirt', 'shirts', 'kemeja'],
  blus: ['blus', 'blouse', 'tunik', 'tunic'],
  blouse: ['blouse', 'blus', 'tunik', 'tunic'],
  kaos: ['kaos', 'tshirt', 't-shirt', 'tee', 'singlet'],
  tshirt: ['tshirt', 't-shirt', 'kaos', 'tee'],
  tee: ['tee', 'kaos', 'tshirt', 't-shirt'],
  tunik: ['tunik', 'tunic', 'blouse', 'blus', 'atasan', 'top', 'baju'],
  tunic: ['tunic', 'tunik', 'blouse', 'blus', 'atasan', 'top', 'baju'],
  turtleneck: ['turtleneck', 'inner', 'manset', 'singlet'],
  inner: ['inner', 'manset', 'turtleneck', 'singlet'],
  manset: ['manset', 'inner', 'turtleneck', 'singlet'],
  singlet: ['singlet', 'inner', 'manset', 'turtleneck', 'tanktop', 'tank top'],

  // Bawahan / Bottoms (Kategori umum & spesifik, termasuk istilah Malaysia: seluar, slack, palazzo, skirt)
  bawahan: ['bawahan', 'bottoms', 'pants', 'skirt', 'celana', 'rok', 'culotte', 'kulot', 'seluar', 'slack', 'palazzo', 'kain'],
  bottoms: ['bottoms', 'bawahan', 'pants', 'skirt', 'celana', 'rok', 'culotte', 'kulot', 'seluar', 'slack', 'palazzo', 'kain'],
  celana: ['celana', 'seluar', 'pants', 'trouser', 'trousers', 'culotte', 'kulot', 'palazzo', 'palazo', 'slack', 'slacks'],
  seluar: ['seluar', 'celana', 'pants', 'trouser', 'trousers', 'culotte', 'kulot', 'palazzo', 'palazo', 'slack', 'slacks'],
  pants: ['pants', 'celana', 'seluar', 'trouser', 'trousers', 'culotte', 'kulot', 'palazzo', 'slack'],
  trouser: ['trouser', 'trousers', 'celana', 'seluar', 'pants', 'slack'],
  trousers: ['trouser', 'trousers', 'celana', 'seluar', 'pants', 'slack'],
  kulot: ['kulot', 'culotte', 'celana', 'seluar', 'palazzo', 'palazo', 'pants'],
  culotte: ['culotte', 'kulot', 'celana', 'seluar', 'palazzo', 'palazo', 'pants'],
  palazzo: ['palazzo', 'palazo', 'kulot', 'culotte', 'celana', 'seluar', 'pants'],
  palazo: ['palazo', 'palazzo', 'kulot', 'culotte', 'celana', 'seluar', 'pants'],
  slack: ['slack', 'slacks', 'celana', 'seluar', 'pants', 'trouser', 'trousers'],
  slacks: ['slacks', 'slack', 'celana', 'seluar', 'pants', 'trouser', 'trousers'],
  rok: ['rok', 'skirt', 'kain'],
  skirt: ['skirt', 'rok', 'kain'],
  kain: ['kain', 'skirt', 'rok'],

  // Dress, Gamis & Kurung
  dress: ['dress', 'gaun', 'gamis', 'terusan', 'kurung'],
  gaun: ['gaun', 'dress', 'gamis'],
  gamis: ['gamis', 'dress', 'gaun', 'abaya', 'kurung'],
  abaya: ['abaya', 'gamis', 'dress'],
  kurung: ['kurung', 'gamis', 'dress', 'setelan', 'set'],
  set: ['set', 'oneset', 'one-set', 'setelan', 'kurung'],
  oneset: ['oneset', 'one-set', 'set', 'setelan'],
  setelan: ['setelan', 'oneset', 'one-set', 'set', 'kurung'],

  // Outerwear
  jaket: ['jaket', 'jacket', 'outerwear', 'outer', 'vest', 'rompi'],
  jacket: ['jacket', 'jaket', 'outerwear', 'outer', 'vest', 'rompi'],
  rompi: ['rompi', 'vest', 'outerwear', 'outer'],
  vest: ['vest', 'rompi', 'outerwear', 'outer'],
  outer: ['outer', 'outerwear', 'vest', 'jacket', 'jaket', 'cardigan', 'kardigan'],
  outerwear: ['outerwear', 'outer', 'vest', 'jacket', 'jaket', 'cardigan'],
  cardigan: ['cardigan', 'kardigan', 'outer'],
  kardigan: ['kardigan', 'cardigan', 'outer'],

  // Hijab & Aksesoris (termasuk tudung, bawal, bengkung)
  hijab: ['hijab', 'jilbab', 'kerudung', 'square', 'pashmina', 'khimar', 'paris', 'tudung', 'shawl'],
  jilbab: ['jilbab', 'hijab', 'kerudung', 'square', 'pashmina', 'khimar', 'tudung'],
  kerudung: ['kerudung', 'hijab', 'jilbab', 'square', 'pashmina', 'tudung'],
  tudung: ['tudung', 'hijab', 'jilbab', 'kerudung', 'shawl', 'pashmina'],
  square: ['square', 'hijab', 'segiempat', 'segi empat', 'paris', 'bawal'],
  bawal: ['bawal', 'square', 'hijab', 'segiempat', 'paris'],
  pashmina: ['pashmina', 'pasmina', 'hijab', 'shawl'],
  pasmina: ['pasmina', 'pashmina', 'hijab', 'shawl'],
  shawl: ['shawl', 'pashmina', 'pasmina', 'hijab'],
  sabuk: ['sabuk', 'belt', 'obi', 'bengkung'],
  belt: ['belt', 'sabuk', 'obi', 'bengkung'],
  obi: ['obi', 'belt', 'sabuk', 'bengkung'],
  bengkung: ['bengkung', 'obi', 'belt', 'sabuk'],

  // Umum
  baju: ['baju', 'pakaian', 'shirt', 'blouse', 'top', 'tops', 'dress', 'kemeja', 'blus'],
  pakaian: ['pakaian', 'baju', 'outfit', 'busana'],
  busana: ['busana', 'pakaian', 'baju', 'outfit'],
}

/**
 * Pemetaan frasa multi-kata untuk normalisasi query sebelum tokenisasi
 */
export const MULTI_WORD_PHRASE_MAP: Record<string, string> = {
  'baju t': 'kaos',
  't-shirt': 'tshirt',
  't shirt': 'tshirt',
  'tank top': 'singlet',
  'tali pinggang': 'sabuk',
  'ikat pinggang': 'sabuk',
  'seluar panjang': 'celana',
  'seluar pendek': 'celana',
  'celana panjang': 'celana',
  'celana pendek': 'celana',
  'baju kurung': 'kurung',
  'segi empat': 'square',
  'segiempat': 'square',
  'one set': 'oneset',
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
  description_en?: string | null
  short_description_en?: string | null
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
  let cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return 0

  const name = (product.name || '').toLowerCase()
  const slug = (product.slug || '').toLowerCase()
  const shortDesc = `${product.short_description || ''} ${product.short_description_en || ''}`.toLowerCase()
  const desc = `${product.description || ''} ${product.description_en || ''}`.toLowerCase()

  // 1. Direct full query exact matches (paling tinggi)
  if (name === cleanQuery) return 1000
  if (name.includes(cleanQuery)) return 500
  if (slug.includes(cleanQuery)) return 400

  // Normalisasi frasa multi-kata (e.g. "baju t" -> "kaos", "tali pinggang" -> "sabuk")
  for (const [phrase, replacement] of Object.entries(MULTI_WORD_PHRASE_MAP)) {
    if (cleanQuery.includes(phrase)) {
      cleanQuery = cleanQuery.replace(new RegExp(phrase, 'g'), replacement)
    }
  }

  const tokens = cleanQuery.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0

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
